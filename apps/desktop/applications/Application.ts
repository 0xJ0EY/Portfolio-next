type ApplicationEvent = null;

interface Application {
  startup(): void;
  on(event: ApplicationEvent): void;
  quit(): void;
}
