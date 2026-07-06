(function () {
  const SCHEMA = "campus2d.debate.audio.v1";
  const DEFAULT_ICE_SERVERS = Object.freeze([
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" }
  ]);

  function createStatus(overrides = {}) {
    return {
      enabled: false,
      muted: false,
      connecting: false,
      permissionDenied: false,
      supported: Boolean(window.RTCPeerConnection && navigator.mediaDevices?.getUserMedia),
      error: "",
      peerCount: 0,
      routeLabel: "Audio idle",
      canSend: false,
      ...overrides
    };
  }

  function getIceServers() {
    const configured = window["WSC_DEBATE_AUDIO_CONFIG"]?.iceServers;
    return Array.isArray(configured) && configured.length ? configured : DEFAULT_ICE_SERVERS;
  }

  function sortClientIds(left, right) {
    return String(left || "").localeCompare(String(right || ""));
  }

  function createManager({
    localClientId,
    sendSignal,
    shouldHearPeer,
    shouldConnectPeer,
    onStatusChange
  } = {}) {
    let enabled = false;
    let muted = false;
    let connecting = false;
    let permissionDenied = false;
    let error = "";
    let localStream = null;
    let sessionId = "";
    let route = null;
    let peers = [];
    let destroyed = false;
    const peerConnections = new Map();
    const remoteAudio = new Map();
    const pendingCandidates = new Map();
    const makingOffer = new Set();
    const audioLayer = document.createElement("div");
    audioLayer.className = "campus2d-debate-audio-layer";
    audioLayer.hidden = true;
    audioLayer.setAttribute("aria-hidden", "true");
    document.body.append(audioLayer);

    function emitStatus() {
      const status = createStatus({
        enabled,
        muted,
        connecting,
        permissionDenied,
        supported: Boolean(window.RTCPeerConnection && navigator.mediaDevices?.getUserMedia),
        error,
        peerCount: peerConnections.size,
        routeLabel: route?.label || "Audio idle",
        canSend: Boolean(route?.canSend && enabled && !muted)
      });
      onStatusChange?.(status);
      return status;
    }

    function getPeer(peerClientId) {
      return peers.find((peer) => peer.clientId === peerClientId) || null;
    }

    function canUsePeer(peer) {
      return Boolean(
        enabled &&
        sessionId &&
        peer?.clientId &&
        peer.clientId !== localClientId &&
        peer.debateAudio?.enabled &&
        peer.debateAudio?.sessionId === sessionId
      );
    }

    function canConnectPeer(peer) {
      if (!canUsePeer(peer)) {
        return false;
      }
      if (shouldConnectPeer) {
        return shouldConnectPeer(route, peer.clientId);
      }
      return shouldHearPeer?.(route, peer.clientId);
    }

    function sendPeerSignal(peerClientId, payload) {
      if (!sessionId || !peerClientId || destroyed) {
        return;
      }
      sendSignal?.({
        schema: SCHEMA,
        sessionId,
        fromClientId: localClientId,
        toClientId: peerClientId,
        ...payload
      });
    }

    function applyLocalTrackPolicy() {
      const canSend = Boolean(enabled && !muted && route?.canSend);
      localStream?.getAudioTracks().forEach((track) => {
        track.enabled = canSend;
      });
      remoteAudio.forEach((audio, peerClientId) => {
        audio.muted = !shouldHearPeer?.(route, peerClientId);
      });
      emitStatus();
    }

    function addLocalTracks(connection) {
      if (!localStream) {
        return;
      }
      const senders = connection.getSenders();
      localStream.getAudioTracks().forEach((track) => {
        if (!senders.some((sender) => sender.track === track)) {
          connection.addTrack(track, localStream);
        }
      });
    }

    function removePeer(peerClientId) {
      const connection = peerConnections.get(peerClientId);
      if (connection) {
        connection.onicecandidate = null;
        connection.ontrack = null;
        connection.onconnectionstatechange = null;
        connection.close();
      }
      peerConnections.delete(peerClientId);
      pendingCandidates.delete(peerClientId);
      makingOffer.delete(peerClientId);
      const audio = remoteAudio.get(peerClientId);
      if (audio) {
        audio.srcObject = null;
        audio.remove();
      }
      remoteAudio.delete(peerClientId);
    }

    async function flushPendingCandidates(peerClientId, connection) {
      const candidates = pendingCandidates.get(peerClientId) || [];
      pendingCandidates.delete(peerClientId);
      for (const candidate of candidates) {
        try {
          await connection.addIceCandidate(candidate);
        } catch (_error) {}
      }
    }

    async function makeOffer(peerClientId) {
      const connection = peerConnections.get(peerClientId);
      if (!connection || makingOffer.has(peerClientId) || destroyed) {
        return;
      }
      makingOffer.add(peerClientId);
      try {
        addLocalTracks(connection);
        const offer = await connection.createOffer({ offerToReceiveAudio: true });
        await connection.setLocalDescription(offer);
        sendPeerSignal(peerClientId, {
          type: "offer",
          description: connection.localDescription
        });
      } catch (offerError) {
        error = offerError?.message || "Could not start Debate Lab audio.";
      } finally {
        makingOffer.delete(peerClientId);
        emitStatus();
      }
    }

    function ensurePeer(peerClientId) {
      if (peerConnections.has(peerClientId)) {
        return peerConnections.get(peerClientId);
      }
      const connection = new RTCPeerConnection({ iceServers: getIceServers() });
      peerConnections.set(peerClientId, connection);
      connection.onicecandidate = (event) => {
        if (event.candidate) {
          sendPeerSignal(peerClientId, {
            type: "ice",
            candidate: event.candidate
          });
        }
      };
      connection.ontrack = (event) => {
        let audio = remoteAudio.get(peerClientId);
        if (!audio) {
          audio = document.createElement("audio");
          audio.autoplay = true;
          audio.playsInline = true;
          audio.dataset.campus2dDebateAudioPeer = peerClientId;
          audioLayer.append(audio);
          remoteAudio.set(peerClientId, audio);
        }
        audio.srcObject = event.streams[0] || new MediaStream([event.track]);
        audio.muted = !shouldHearPeer?.(route, peerClientId);
        audio.play?.().catch(() => {});
      };
      connection.onconnectionstatechange = () => {
        if (["failed", "closed", "disconnected"].includes(connection.connectionState)) {
          removePeer(peerClientId);
        }
        emitStatus();
      };
      addLocalTracks(connection);
      return connection;
    }

    function syncPeers() {
      if (!enabled || !sessionId || destroyed) {
        return;
      }
      const desiredPeers = new Set(peers.filter(canConnectPeer).map((peer) => peer.clientId));
      peerConnections.forEach((_connection, peerClientId) => {
        if (!desiredPeers.has(peerClientId)) {
          removePeer(peerClientId);
        }
      });
      desiredPeers.forEach((peerClientId) => {
        ensurePeer(peerClientId);
        if (sortClientIds(localClientId, peerClientId) < 0) {
          makeOffer(peerClientId);
        }
      });
      applyLocalTrackPolicy();
    }

    async function enable() {
      if (destroyed || enabled) {
        return emitStatus();
      }
      if (!window.RTCPeerConnection || !navigator.mediaDevices?.getUserMedia) {
        error = "This browser does not support Debate Lab audio.";
        return emitStatus();
      }
      connecting = true;
      permissionDenied = false;
      error = "";
      emitStatus();
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false
        });
        enabled = true;
        muted = false;
        localStream.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
        syncPeers();
      } catch (mediaError) {
        permissionDenied = mediaError?.name === "NotAllowedError" || mediaError?.name === "PermissionDeniedError";
        error = permissionDenied ? "Microphone permission was denied." : (mediaError?.message || "Could not start the microphone.");
        enabled = false;
      } finally {
        connecting = false;
        applyLocalTrackPolicy();
      }
      return emitStatus();
    }

    function setMuted(nextMuted) {
      muted = Boolean(nextMuted);
      applyLocalTrackPolicy();
      return emitStatus();
    }

    function update(next = {}) {
      sessionId = next.sessionId || "";
      route = next.route || null;
      peers = Array.isArray(next.peers) ? next.peers : [];
      if (!sessionId || next.debateStatus === "ended") {
        closePeers();
      } else {
        syncPeers();
      }
      applyLocalTrackPolicy();
      return emitStatus();
    }

    async function handleSignal(signal) {
      if (
        destroyed ||
        !enabled ||
        !signal ||
        signal.sessionId !== sessionId ||
        signal.toClientId !== localClientId ||
        !signal.fromClientId ||
        signal.fromClientId === localClientId ||
        !getPeer(signal.fromClientId)
      ) {
        return;
      }
      const connection = ensurePeer(signal.fromClientId);
      try {
        if (signal.type === "offer" && signal.description) {
          await connection.setRemoteDescription(signal.description);
          addLocalTracks(connection);
          await flushPendingCandidates(signal.fromClientId, connection);
          const answer = await connection.createAnswer();
          await connection.setLocalDescription(answer);
          sendPeerSignal(signal.fromClientId, {
            type: "answer",
            description: connection.localDescription
          });
        } else if (signal.type === "answer" && signal.description) {
          await connection.setRemoteDescription(signal.description);
          await flushPendingCandidates(signal.fromClientId, connection);
        } else if (signal.type === "ice" && signal.candidate) {
          if (connection.remoteDescription) {
            await connection.addIceCandidate(signal.candidate);
          } else {
            const candidates = pendingCandidates.get(signal.fromClientId) || [];
            candidates.push(signal.candidate);
            pendingCandidates.set(signal.fromClientId, candidates);
          }
        } else if (signal.type === "leave") {
          removePeer(signal.fromClientId);
        }
      } catch (signalError) {
        error = signalError?.message || "Debate Lab audio signaling failed.";
        emitStatus();
      }
    }

    function closePeers() {
      Array.from(peerConnections.keys()).forEach(removePeer);
    }

    function disable() {
      if (sessionId) {
        peers.forEach((peer) => {
          if (peer.clientId !== localClientId) {
            sendPeerSignal(peer.clientId, { type: "leave" });
          }
        });
      }
      closePeers();
      localStream?.getTracks().forEach((track) => track.stop());
      localStream = null;
      enabled = false;
      muted = false;
      connecting = false;
      emitStatus();
    }

    function destroy() {
      destroyed = true;
      disable();
      audioLayer.remove();
    }

    return {
      enable,
      disable,
      setMuted,
      update,
      handleSignal,
      destroy,
      getStatus: emitStatus
    };
  }

  window.WSC_CAMPUS_2D_DEBATE_AUDIO = Object.freeze({
    SCHEMA,
    DEFAULT_ICE_SERVERS,
    createManager
  });
}());
