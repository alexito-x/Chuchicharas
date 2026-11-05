# Entorno privado de pruebas

## Objetivo

Esta rama prepara y valida el proyecto Chuchicharas sin desplegarlo en Azure ni publicar una API, una web o una APK.

## Alcance

- Las pruebas se ejecutan en un runner efímero de GitHub Actions.
- MySQL 8 se inicia como servicio temporal del mismo trabajo; el esquema se importa desde `database/schema.sql`.
- Backend: análisis de sintaxis, pruebas unitarias/de humo y pruebas de integración de autenticación contra esa base temporal.
- Frontend: instalación reproducible, auditoría de dependencias y compilación de validación.
- Al terminar el trabajo, el servicio MySQL temporal desaparece.
- No se ejecutan pasos de despliegue, no se publica una APK y no se configura una URL pública.

## Privacidad y límites reales

El repositorio debe mantenerse con visibilidad **Private**. Esta configuración no cambia la visibilidad del repositorio.

El entorno de pruebas no expone puertos de la aplicación a Internet: MySQL solo se utiliza dentro del trabajo de CI y el backend no se inicia como servicio público. GitHub Actions usa infraestructura alojada por GitHub y necesita acceso saliente a Internet para descargar el código, dependencias y acciones. Por tanto, esto significa **sin endpoint público de la aplicación**, no una red completamente aislada ni un runner autohospedado sin Internet.

Solo deben utilizarse datos ficticios. No cargar datos reales de clientes ni credenciales productivas en los tests.

## Ejecución

1. Abrir la pestaña **Actions** del repositorio.
2. Elegir **Entorno privado de pruebas**.
3. Pulsar **Run workflow** y seleccionar `deploy/staging-local`.
4. Revisar cada paso del trabajo. Un resultado verde confirma únicamente las validaciones ejecutadas por este workflow.

También se ejecuta al recibir nuevos commits en la rama `deploy/staging-local`.

## Fuera de alcance por ahora

- Despliegue en Azure o cualquier hosting público.
- Base de datos productiva.
- APK de distribución.
- Pruebas desde el teléfono contra una API remota.

Cuando el proyecto supere las pruebas, se podrá evaluar por separado un entorno privado accesible por VPN o una publicación de staging protegida. Ninguna de esas opciones se activa con este workflow.
