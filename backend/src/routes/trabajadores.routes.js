import { Router } from "express";
import { autenticar, permitirRoles } from "../middleware/auth.middleware.js";
import {
  listarTrabajadores,
  obtenerTrabajador,
  crearTrabajador,
  actualizarTrabajador,
  cambiarEstadoTrabajador
} from "../controllers/trabajadores.controller.js";

const router = Router();

router.use(autenticar);
router.get("/", listarTrabajadores);
router.get("/:id", obtenerTrabajador);
router.post("/", permitirRoles("administrador"), crearTrabajador);
router.patch("/:id", permitirRoles("administrador"), actualizarTrabajador);
router.patch("/:id/estado", permitirRoles("administrador"), cambiarEstadoTrabajador);

export default router;
