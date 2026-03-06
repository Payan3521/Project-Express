import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

type JwtPayload = jwt.JwtPayload & {
  sub: number;
  email?: string;
};

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Autenticación requerida" });
  }

  const token = header.substring("Bearer ".length);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "JWT_SECRET no está configurado" });
  }

  try {
    const decoded = jwt.verify(token, secret);
    const payload = decoded as JwtPayload;
    if (!payload.sub) {
      return res.status(401).json({ error: "Token inválido" });
    }
    (req as any).userId = payload.sub;
    (req as any).userEmail = payload.email;
    return next();
  } catch (err) {
    console.error("Error verificando token JWT", err);
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}
