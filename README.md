# Smart Schedule Meds

Aplicacion movil local-first que optimiza la programacion de medicamentos, ajustando los horarios de consumo para evitar interrupciones en el ciclo de sueno del usuario.

## Objetivos y Requerimientos del Proyecto

### Objetivo General

Desarrollar un Producto Minimo Viable (MVP) de una aplicacion movil local-first en React Native que optimice la programacion de la toma de medicamentos, ajustando los horarios de consumo para evitar interrupciones en el ciclo de sueno del usuario.

### Objetivos Especificos

1. **Algoritmo "Smart Schedule"**: Calcular la hora sugerida de la primera dosis en funcion del intervalo medico y la ventana de sueno del usuario.
2. **Arquitectura Local-First**: Alto rendimiento y bajo consumo de bateria, prescindiendo de bases de datos remotas o procesos de autenticacion.
3. **Notificaciones Interactivas**: Utilizar las APIs nativas del sistema operativo para permitir la interaccion del usuario directamente desde la pantalla de bloqueo.
4. **UI Centrada en el Usuario**: Interfaz limpia e intuitiva para personas que se encuentran enfermas o en proceso de recuperacion.

### Requerimientos Funcionales

| ID | Descripcion |
|---|---|
| **RF1** | Configuracion del Perfil de Sueno: El usuario debe poder definir su hora habitual de acostarse y de levantarse (ventana de sueno). |
| **RF2** | Registro de Tratamiento: El usuario debe poder ingresar el nombre del medicamento, la frecuencia de las tomas (en horas) y la duracion total del tratamiento. |
| **RF3** | Algoritmo Smart Schedule: El sistema debe proponer la hora ideal para la primera dosis del dia, buscando que las dosis subsiguientes minimicen el solapamiento con la ventana de sueno. |
| **RF4** | Confirmacion y Programacion: Al aceptar la propuesta, el sistema debe programar automaticamente la secuencia de alarmas para todo el tratamiento. |
| **RF5** | Notificaciones Interactivas: Cada alarma debe disparar una notificacion local con dos acciones directas: "Tomar" y "Posponer 15 min". |
| **RF6** | Historial y Progreso: Indicador visual del progreso del tratamiento (ej. "Llevas 3 de 15 dosis"). |

### Requerimientos No Funcionales

| ID | Descripcion |
|---|---|
| **RNF1** | Local-First y Privacidad: Toda la informacion se persiste unicamente en el dispositivo utilizando almacenamiento local. |
| **RNF2** | Independencia de Red: La aplicacion es completamente funcional sin conexion a Internet. |
| **RNF3** | Compatibilidad Multiplataforma: Codigo base compila para iOS y Android utilizando Expo SDK. |
| **RNF4** | Gestion Eficiente de Notificaciones: Limite de 40 notificaciones programadas para no agotar el limite del sistema operativo. |

## Tech Stack

| Capa | Tecnologia |
|---|---|
| Framework | React Native + Expo (Managed Workflow, TypeScript) |
| Estado | Zustand con persistencia via AsyncStorage |
| Notificaciones | expo-notifications con categorias interactivas |
| UI | Design System "Clinical Clarity" (Google Stitch), React Native StyleSheet |
| Navegacion | State-driven (sin dependencias externas de routing) |
| Algoritmo | TypeScript puro, sin librerias externas |

## Estructura del Proyecto

```
smart-schedule-meds/
├── assets/                      # Recursos estaticos (iconos, splash)
├── src/
│   ├── screens/
│   │   ├── SleepSetupScreen.tsx # Configuracion de ventana de sueno
│   │   ├── DashboardScreen.tsx   # Panel principal con timeline y progreso
│   │   └── AddMedicationScreen.tsx # Registro y previsualizacion de medicacion
│   ├── services/
│   │   ├── notificationManager.ts # Inicializacion, schedule, cancel, snooze
│   │   └── notificationListener.ts # Intercepcion de acciones del usuario
│   ├── store/
│   │   ├── useSleepStore.ts      # Estado persistente de la ventana de sueno
│   │   └── useMedsStore.ts       # Estado persistente de medicamentos y dosis
│   ├── types/
│   │   └── medication.types.ts   # Interfaces: SleepWindow, Medication, DoseSchedule
│   └── utils/
│       ├── scheduler.ts          # Algoritmo Smart Schedule
│       ├── scheduler.test.ts     # Runner de verificacion del algoritmo
│       └── theme.ts              # Tokens de diseno (colores, tipografia, espaciado)
├── App.tsx                       # Entry point con navegacion state-driven
├── app.json                      # Configuracion Expo
├── babel.config.js
├── package.json
└── tsconfig.json
```

## Instalacion y Ejecucion

```bash
npm install
npx expo start
```

Para compilar en dispositivos fisicos:

```bash
npx expo run:android   # Android
npx expo run:ios       # iOS (requiere macOS + Xcode)
```

## Fases de Desarrollo

### Fase 1: Scaffolding e Inicializacion
Configuracion manual del proyecto Expo con TypeScript strict, estructura de directorios bajo `src/`, instalacion de dependencias y definicion de interfaces base.

### Fase 2: Stores con Persistencia
Implementacion de Zustand stores con persistencia AsyncStorage para `SleepWindow` y `Medication/DoseSchedule`, con soporte completo para hidratacion en inicio.

### Fase 3: Algoritmo Smart Schedule
Algoritmo de optimizacion que evalua 96 candidatos (step de 15 minutos) y selecciona la hora optima de primera dosis minimizando dosis en la ventana de sueno y maximizando cercania a los bordes de la ventana.

### Fase 4: Motor de Notificaciones
Sistema completo de notificaciones locales interactivas con botones "Tomar" y "Posponer 15 min", manejo de permisos, schedule limitado a 40 notificaciones, cancelacion y snooze con persistencia de estados.

### Fase 5: Screens e Integracion UI
Tres pantallas implementadas siguiendo el design system "Clinical Clarity" de Google Stitch: Sleep Setup (con dial circular y datetimepicker nativo), Dashboard (con timeline visual, cards de progreso, FAB y bottom nav), y Add Medication (con preview del smart schedule y badge "Optimized: Sleep Boundary").