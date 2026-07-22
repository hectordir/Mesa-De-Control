# Goal

Implementar la metodología de subagentes en este proyecto: una sesión principal que **orquesta** y
subagentes especialistas de **frontend** y **backend**. Las tareas se ejecutan a partir del
orquestador, que planifica y delega en los subagentes la investigación y la escritura de código.
El objetivo es que el orquestador mantenga el contexto lo más limpio posible y que delegue las
acciones para que la ejecución sea más eficiente. Metodología: **spec driven development (SDD)**
combinada con **test driven development (TDD)**. Para docs de librerías se usa **context7**; para
skills, `skills.sh` (registrado en `skills-lock.json`).

> Este setup fue adaptado del proyecto **smart-spending**
> (https://github.com/JuanCJR/smart-spending) al stack de Mesa de Control.

# Stack tecnológico

Frontend: React 19, Vite, TypeScript, Tailwind CSS v3, React Router (SPA), React Query, Zustand,
Axios, React Testing Library, Vitest, Playwright
Backend: Node.js, NestJS 11, TypeScript, Prisma, PostgreSQL, Autenticación JWT, Swagger, Jest

# Nombre de aplicación

Mesa de Control (clon de Fibex Control)
