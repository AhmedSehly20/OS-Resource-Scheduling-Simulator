import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AlgorithmSimulator from "@/pages/AlgorithmSimulator";
import { SimulationProvider } from "@/contexts/SimulationContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={AlgorithmSimulator} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SimulationProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </SimulationProvider>
    </QueryClientProvider>
  );
}

export default App;
