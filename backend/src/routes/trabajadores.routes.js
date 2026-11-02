import { Router } from "express";
import { autenticar, permitirRoles } from "../middleware/auth.middleware.js";
import {
  listarTrabajadores,
  obtenerTrabajador,
  crearTrabajador,
  actualizarTrabajador,
  cambiarEstadoTrabajador,
  crearCuentaTrabajador
} from "../controllers/trabajadores.controller.js";

const router = Router();

router.use(autenticar);
router.get("/", permitirRoles("administrador"), listarTrabajadores);
router.get("/:id", permitirRoles("administrador"), obtenerTrabajador);
router.post("/", permitirRoles("administrador"), crearTrabajador);
router.patch("/:id", permitirRoles("administrador"), actualizarTrabajador);
router.post("/:id/cuenta", permitirRoles("administrador"), crearCuentaTrabajador);
router.patch("/:id/estado", permitirRoles("administrador"), cambiarEstadoTrabajador);

export default router;
