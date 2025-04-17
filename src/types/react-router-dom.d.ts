// Adiciona tipagem para useLocation do react-router-dom
import "react-router-dom";
declare module "react-router-dom" {
  interface Location {
    key: string;
  }
}
