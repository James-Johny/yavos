fetch("listabos.csv")
  .then(response => response.text())
  .then(data => {
    const lines = data.split("\n").map(line => line.split(";"))
  })