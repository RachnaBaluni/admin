/* ================= PRINT ================= */
const handlePrint = () => {

  const printWindow = window.open(
    "",
    "_blank"
  );

  let html = `
    <html>

    <head>

      <title>
        Order Of Play
      </title>

      <style>

        body{
          font-family: Arial;
          padding:20px;
          background:white;
        }

        h1{
          text-align:center;
          margin-bottom:30px;
        }

        .table{
          display:grid;
          grid-template-columns:repeat(4,1fr);
          gap:12px;
        }

        .court{
          border:1px solid #000;
          padding:12px;
          text-align:center;
          font-weight:bold;
          background:#e6ffe6;
          border-radius:6px;
        }

        .card{
          border:1px solid #999;
          border-radius:8px;
          padding:12px;
          text-align:center;
          min-height:100px;
          background:#fafafa;
        }

        .time{
          color:#2563eb;
          font-weight:bold;
          margin-bottom:6px;
          font-size:14px;
        }

        .category{
          color:green;
          font-size:12px;
          font-weight:bold;
          margin-bottom:8px;
        }

        .vs{
          color:red;
          font-weight:bold;
          margin:8px 0;
        }

      </style>

    </head>

    <body>

      <h1>
        ORDER OF PLAY
      </h1>

      <div class="table">

        <div class="court">
          COURT 1
        </div>

        <div class="court">
          COURT 2
        </div>

        <div class="court">
          COURT 3
        </div>

        <div class="court">
          COURT 4
        </div>
  `;

  grid.forEach((row) => {

    row.forEach((cell) => {

      if (!cell?.match) {

        html += `<div></div>`;

        return;
      }

      const teamName = (team) =>
        team
          ? `${team.partner1?.name || ""}
             ${
               team.partner2
                 ? " & " + team.partner2?.name
                 : ""
             }`
          : "BYE";

      html += `

        <div class="card">

          <div class="time">

            ${
              cell.time.includes("Followed")
                ? "Followed By"
                : cell.time
            }

          </div>

          <div class="category">

            ${cell.match.category}

          </div>

          <div>

            ${teamName(cell.match.Team1)}

          </div>

          <div class="vs">

            VS

          </div>

          <div>

            ${teamName(cell.match.Team2)}

          </div>

        </div>
      `;
    });

  });

  html += `

      </div>

    </body>

    </html>
  `;

  printWindow.document.write(html);

  printWindow.document.close();

  setTimeout(() => {

    printWindow.print();

  }, 500);
};