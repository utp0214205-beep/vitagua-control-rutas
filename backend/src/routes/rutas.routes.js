import { Router } from "express";
import { autenticar, permitirRoles } from "../middleware/auth.middleware.js";
import {
  listarRutas,
  obtenerRuta,
  crearRuta,
  actualizarRuta,
  cambiarEstadoRuta
} from "../controllers/rutas.controller.js";

const router = Router();

router.use(autenticar);
router.get("/", permitirRoles("administrador"), listarRutas);
router.get("/:id", permitirRoles("administrador"), obtenerRuta);
router.post("/", permitirRoles("administrador"), crearRuta);
router.patch("/:id", permitirRoles("administrador"), actualizarRuta);
router.patch("/:id/estado", permitirRoles("administrador"), cambiarEstadoRuta);

export default router;
