import { Router } from "express";
import { autenticar, permitirRoles } from "../middleware/auth.middleware.js";
import {
  listarAsignaciones,
  listarMisAsignaciones,
  crearAsignacion,
  cambiarEstadoAsignacion
} from "../controllers/asignaciones.controller.js";

const router = Router();
router.use(autenticar);
router.get("/mias", listarMisAsignaciones);
router.get("/", permitirRoles("administrador"), listarAsignaciones);
router.post("/", permitirRoles("administrador"), crearAsignacion);
router.patch("/:id/estado", permitirRoles("administrador"), cambiarEstadoAsignacion);
export default router;
