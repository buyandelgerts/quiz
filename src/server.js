const express = require("express");
const cors = require("cors");
const usersData = require("./users.json");

const app = express();
app.use(cors());
app.use(express.json());

function makeToken(payload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}
function readToken(token) {
  const json = Buffer.from(token, "base64url").toString("utf8");
  return JSON.parse(json);
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    req.user = readToken(token);
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "demo-render-auth" });
});

app.post("/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "username and password are required" });
  }

  const user = usersData.users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const token = makeToken({
    username: user.username,
    iat: Date.now(),
  });

  return res.json({
    message: "Login success",
    token,
    user: { username: user.username },
  });
});

app.get("/protected", requireAuth, (req, res) => {
  res.json({
    message: "Hooray! nerdy guy. You did it!",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
