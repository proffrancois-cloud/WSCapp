(function () {
  function renderSectionTransferTable(sectionOrEntry, options = {}, helpers) {
    const escapeHtml = helpers.escapeHtml;
    const table = sectionOrEntry?.transferTable || sectionOrEntry?.sectionTransferTable || null;
    const rows = Array.isArray(table?.rows) ? table.rows : [];
    if (!rows.length) {
      return "";
    }

    const intro = options.context === "guide"
      ? ""
      : "Examples that extend the same logic as this guiding section.";
    const tableHtml = `
      <div class="transfer-table-scroll">
        <table class="transfer-table">
          <thead>
            <tr>
              <th>Logic to extend</th>
              <th>Official anchor</th>
              <th>Nearby WSC connection</th>
              <th>Outside example</th>
              <th>Why it fits</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td>${escapeHtml(row.logicToExtend)}</td>
                <td>${escapeHtml(row.officialAnchor)}</td>
                <td>${escapeHtml(row.nearbyWscConnection)}</td>
                <td>${escapeHtml(row.outsideExample)}</td>
                <td>${escapeHtml(row.whyItFits)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    if (options.collapsed) {
      return `
        <details class="raw-block transfer-table-block transfer-table-details">
          <summary>
          <span>Transfer table</span>
          <span>${rows.length} connections</span>
        </summary>
          ${intro ? `<p>${escapeHtml(intro)}</p>` : ""}
          ${tableHtml}
        </details>
      `;
    }

    return `
      <div class="raw-block transfer-table-block">
        <strong>Transfer table</strong>
        ${intro ? `<p>${escapeHtml(intro)}</p>` : ""}
        ${tableHtml}
      </div>
    `;
  }

  window.WSC_RAW_CONTENT_TRANSFER_TABLE = Object.freeze({
    renderSectionTransferTable
  });
}());
