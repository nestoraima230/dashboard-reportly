import React from 'react';
import KPIReportesDiarios from '../KPIReportesDiarios';
import ReportesPorEtiquetas from '../ReportesPorEtiquetas';
import ReportesPorColonia from '../ReportesPorColonia';
import TendenciaSemanalReportes from '../TendenciaSemanalReportes';
import LineChartsMensuales from '../UsuariosYPostPorDia';
import './App.css'; 

function App() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard de Reportes Ciudadanos</h1>
      <KPIReportesDiarios />
      {/* <TendenciaSemanalReportes /> */}
      <hr />
      <ReportesPorEtiquetas />
      <hr />
      <ReportesPorColonia /> 
      <hr />
      <LineChartsMensuales />
    </div>
  );
}

export default App;