import { getBoletines } from "./actions";
import { BoletinApp } from "@/components/boletin-app";

export default async function Home() {
  // Fetch de datos en el servidor - esto se ejecuta antes de enviar HTML al cliente
  const { boletines, boletinesPorAnio } = await getBoletines();
  
  // Encontrar el boletín activo para seleccionarlo por defecto
  const boletinActivo = boletines.find((b) => b.activo);

  return (
    <BoletinApp
      initialBoletines={boletines}
      initialBoletinesPorAnio={boletinesPorAnio}
      initialBoletinId={boletinActivo?.id || null}
    />
  );
}
