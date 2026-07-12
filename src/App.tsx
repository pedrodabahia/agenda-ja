import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Code splitting por rota: quem abre "/" não baixa o bundle da
// página da empresa, e quem abre "/:slug" não baixa o do formulário.
// Isso deixa o primeiro carregamento mais leve no celular.
const Home = lazy(() => import("./pages/Home"));
const BusinessPage = lazy(() => import("./pages/BusinessPage"));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/:slug" element={<BusinessPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
