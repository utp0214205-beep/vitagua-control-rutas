import { Router } from "express";
import { autenticar } from "../middleware/auth.middleware.js";
import {
  listarRecorridos,
  listarRecorridosAbiertos,
  obtenerRecorrido,
  registrarSalida,
  registrarRegreso
} from "../controllers/recorridos.controller.js";

const router = Router();

router.use(autenticar);

// Las rutas específicas deben declararse antes de /:id.
router.get("/abiertos", listarRecorridosAbiertos);
router.get("/", listarRecorridos);
router.get("/:id", obtenerRecorrido);
router.post("/", registrarSalida);
router.patch("/:id/regreso", registrarRegreso);

export default router;
