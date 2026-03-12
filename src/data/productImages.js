/**
 * Mapa id de producto -> URL de imagen (desde src/assets/products/).
 * Vite resuelve las rutas en build. Si falta un archivo, ese id no estará en el mapa.
 */
const modules = import.meta.glob("../assets/products/*.{jpg,jpeg,png}", {
  eager: true,
  import: "default",
});

const map = {};
for (const path in modules) {
  const filename = path.split("/").pop();
  const id = filename.replace(/\.(jpg|jpeg|png)$/i, "");
  map[id] = modules[path];
}

export default map;
