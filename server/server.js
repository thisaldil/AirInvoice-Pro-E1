const buffer = require("buffer");

if (!buffer.SlowBuffer) {
  buffer.SlowBuffer = Buffer;
}

const app = require("./api/server");

const PORT = process.env.PORT || 4001;
const HOST = process.env.HOST || "127.0.0.1";

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
