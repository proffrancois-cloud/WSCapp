(function () {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rectContains(rect, point) {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  }

  function polygonContains(polygon, point) {
    const points = Array.isArray(polygon?.points) ? polygon.points : [];
    if (points.length < 3) {
      return false;
    }

    let inside = false;
    for (let index = 0, previous = points.length - 1; index < points.length; previous = index, index += 1) {
      const currentPoint = points[index];
      const previousPoint = points[previous];
      const currentY = Number(currentPoint.y);
      const previousY = Number(previousPoint.y);
      const currentX = Number(currentPoint.x);
      const previousX = Number(previousPoint.x);
      const crossesY = currentY > point.y !== previousY > point.y;
      if (!crossesY) {
        continue;
      }
      const intersectX = ((previousX - currentX) * (point.y - currentY)) / (previousY - currentY) + currentX;
      if (point.x < intersectX) {
        inside = !inside;
      }
    }
    return inside;
  }

  function zoneContains(zone, point) {
    return Array.isArray(zone?.points) ? polygonContains(zone, point) : rectContains(zone, point);
  }

  function pointDistance(left, right) {
    const dx = left.x - right.x;
    const dy = left.y - right.y;
    return Math.hypot(dx, dy);
  }

  function createMovementEngine(room, options = {}) {
    const cellSize = options.cellSize || 32;
    const bounds = room.walkBounds || { x: 0, y: 0, width: room.world.width, height: room.world.height };
    const walkZones = room.walkZones || [];
    const blockedZones = room.blockedZones || [];
    const columns = Math.max(1, Math.ceil(bounds.width / cellSize));
    const rows = Math.max(1, Math.ceil(bounds.height / cellSize));

    function clampPoint(point) {
      return {
        x: clamp(Number(point.x) || bounds.x, bounds.x, bounds.x + bounds.width),
        y: clamp(Number(point.y) || bounds.y, bounds.y, bounds.y + bounds.height)
      };
    }

    function isWalkable(point) {
      const clamped = clampPoint(point);
      if (clamped.x !== point.x || clamped.y !== point.y) {
        return false;
      }
      if (walkZones.length && !walkZones.some((zone) => zoneContains(zone, point))) {
        return false;
      }
      return !blockedZones.some((rect) => rectContains(rect, point));
    }

    function toCell(point) {
      const clamped = clampPoint(point);
      return {
        col: clamp(Math.floor((clamped.x - bounds.x) / cellSize), 0, columns - 1),
        row: clamp(Math.floor((clamped.y - bounds.y) / cellSize), 0, rows - 1)
      };
    }

    function toWorld(cell) {
      return {
        x: bounds.x + cell.col * cellSize + cellSize / 2,
        y: bounds.y + cell.row * cellSize + cellSize / 2
      };
    }

    function cellKey(cell) {
      return `${cell.col}:${cell.row}`;
    }

    function isCellWalkable(cell) {
      return (
        cell.col >= 0 &&
        cell.col < columns &&
        cell.row >= 0 &&
        cell.row < rows &&
        isWalkable(toWorld(cell))
      );
    }

    function findNearestWalkable(point) {
      const startCell = toCell(point);
      if (isCellWalkable(startCell)) {
        return toWorld(startCell);
      }

      const maxRadius = Math.max(columns, rows);
      for (let radius = 1; radius <= maxRadius; radius += 1) {
        const candidates = [];
        for (let dx = -radius; dx <= radius; dx += 1) {
          candidates.push({ col: startCell.col + dx, row: startCell.row - radius });
          candidates.push({ col: startCell.col + dx, row: startCell.row + radius });
        }
        for (let dy = -radius + 1; dy <= radius - 1; dy += 1) {
          candidates.push({ col: startCell.col - radius, row: startCell.row + dy });
          candidates.push({ col: startCell.col + radius, row: startCell.row + dy });
        }

        const walkable = candidates
          .filter(isCellWalkable)
          .map(toWorld)
          .sort((left, right) => pointDistance(left, point) - pointDistance(right, point));
        if (walkable.length) {
          return walkable[0];
        }
      }

      return toWorld(startCell);
    }

    function neighbors(cell) {
      const candidates = [
        { col: cell.col + 1, row: cell.row },
        { col: cell.col - 1, row: cell.row },
        { col: cell.col, row: cell.row + 1 },
        { col: cell.col, row: cell.row - 1 },
        { col: cell.col + 1, row: cell.row + 1 },
        { col: cell.col + 1, row: cell.row - 1 },
        { col: cell.col - 1, row: cell.row + 1 },
        { col: cell.col - 1, row: cell.row - 1 }
      ];
      return candidates.filter((candidate) => {
        if (!isCellWalkable(candidate)) {
          return false;
        }
        const dx = candidate.col - cell.col;
        const dy = candidate.row - cell.row;
        if (dx && dy) {
          return (
            isCellWalkable({ col: cell.col + dx, row: cell.row }) &&
            isCellWalkable({ col: cell.col, row: cell.row + dy })
          );
        }
        return true;
      });
    }

    function heuristic(left, right) {
      return Math.hypot(left.col - right.col, left.row - right.row);
    }

    function reconstruct(cameFrom, current) {
      const path = [current];
      let key = cellKey(current);
      while (cameFrom.has(key)) {
        current = cameFrom.get(key);
        path.push(current);
        key = cellKey(current);
      }
      return path.reverse().map(toWorld);
    }

    function findPath(fromPoint, toPoint) {
      const from = findNearestWalkable(fromPoint);
      const to = findNearestWalkable(toPoint);
      const start = toCell(from);
      const goal = toCell(to);
      const open = [start];
      const cameFrom = new Map();
      const gScore = new Map([[cellKey(start), 0]]);
      const fScore = new Map([[cellKey(start), heuristic(start, goal)]]);
      const visited = new Set();

      while (open.length) {
        open.sort((left, right) => (fScore.get(cellKey(left)) ?? Infinity) - (fScore.get(cellKey(right)) ?? Infinity));
        const current = open.shift();
        const currentKey = cellKey(current);

        if (current.col === goal.col && current.row === goal.row) {
          const path = reconstruct(cameFrom, current);
          path[0] = { x: fromPoint.x, y: fromPoint.y };
          path[path.length - 1] = to;
          return smoothPath(path);
        }

        visited.add(currentKey);

        neighbors(current).forEach((neighbor) => {
          const neighborKey = cellKey(neighbor);
          if (visited.has(neighborKey)) {
            return;
          }

          const stepCost = heuristic(current, neighbor);
          const tentativeG = (gScore.get(currentKey) ?? Infinity) + stepCost;
          if (tentativeG >= (gScore.get(neighborKey) ?? Infinity)) {
            return;
          }

          cameFrom.set(neighborKey, current);
          gScore.set(neighborKey, tentativeG);
          fScore.set(neighborKey, tentativeG + heuristic(neighbor, goal));
          if (!open.some((cell) => cell.col === neighbor.col && cell.row === neighbor.row)) {
            open.push(neighbor);
          }
        });
      }

      return [fromPoint, to].filter(Boolean);
    }

    function hasLineOfSight(left, right) {
      const steps = Math.max(1, Math.ceil(pointDistance(left, right) / (cellSize / 2)));
      for (let index = 1; index <= steps; index += 1) {
        const progress = index / steps;
        const point = {
          x: left.x + (right.x - left.x) * progress,
          y: left.y + (right.y - left.y) * progress
        };
        if (!isWalkable(point)) {
          return false;
        }
      }
      return true;
    }

    function smoothPath(path) {
      if (!Array.isArray(path) || path.length <= 2) {
        return path || [];
      }

      const result = [path[0]];
      let anchorIndex = 0;
      let checkIndex = 2;
      while (checkIndex < path.length) {
        if (!hasLineOfSight(path[anchorIndex], path[checkIndex])) {
          result.push(path[checkIndex - 1]);
          anchorIndex = checkIndex - 1;
        }
        checkIndex += 1;
      }
      result.push(path[path.length - 1]);
      return result;
    }

    return {
      cellSize,
      bounds,
      walkZones,
      blockedZones,
      clampPoint,
      isWalkable,
      findNearestWalkable,
      findPath,
      pointDistance
    };
  }

  window.WSC_ALPACA_CAMPUS_MOVEMENT = Object.freeze({
    createMovementEngine,
    rectContains,
    polygonContains,
    pointDistance,
    clamp
  });
}());
