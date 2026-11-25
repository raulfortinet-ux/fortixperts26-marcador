export type SeedQuestion = {
  prompt: string;
  options: { key: string; label: string }[];
  correctKey: string;
  rationale: string;
};

export type SeedTask = {
  id: number;
  title: string;
  moment: string;
  severity: string;
  summary: string;
  questions: SeedQuestion[];
};

export const TASKS: SeedTask[] = [
  {
    id: 1,
    title: "Reconocimiento · alertas",
    moment: "Reconocimiento",
    severity: "Low",
    summary: "¿Quién está mirando y qué busca?",
    questions: [
      {
        prompt: 'En los registros del escaneo, ¿qué valor esperas encontrar en el campo "action"?',
        options: [
          { key: "a", label: "blocked, porque el IPS lo cortó" },
          { key: "b", label: "deny, porque lo denegó la política del FortiGate" },
          { key: "c", label: "detected, porque lo vio el motor de firmas" }
        ],
        correctKey: "b",
        rationale:
          'El escaneo lo para la política, no una firma. "detected" es el valor del motor de IPS, y en este caso no hay firma que dispare todavía.'
      },
      {
        prompt: "Hay dos alertas de escaneo y ningún caso. ¿Cuál es la explicación?",
        options: [
          { key: "a", label: "Las alertas no cumplen las matching conditions de la escalation rule, falla la segunda condición." },
          { key: "b", label: "Las dos alertas están duplicadas y por eso no cuentan" },
          { key: "c", label: "El servidor web no está dado de alta en el inventario" }
        ],
        correctKey: "a",
        rationale:
          "Su escalationCriteria es un AND de dos filtros: recordTags in [Recon, Network Discovery] → la alerta cumple (tiene ambos tags); subcategory in [Discovery, Connectivity] → la alerta NO cumple (su subcategory es Recon)."
      },
      {
        prompt: "El tráfico quedó denegado. ¿Significa eso que el atacante no obtuvo información?",
        options: [
          { key: "a", label: "Sí: si lo deniegan, no recibe nada" },
          { key: "b", label: "Solo si además el IPS estaba en modo bloqueo" },
          { key: "c", label: "No: el tiempo y la forma de la respuesta revelan si el puerto está filtrado o cerrado" }
        ],
        correctKey: "c",
        rationale:
          "Denegar impide la conexión, pero no oculta el mapa de servicios. La diferencia entre un puerto filtrado y uno cerrado se mide en milisegundos, y eso el atacante lo usa."
      }
    ]
  },
  {
    id: 2,
    title: "Explotación",
    moment: "Explotación",
    severity: "Medium",
    summary: "¿Cómo entra?",
    questions: [
      {
        prompt: '¿Qué valor de "attackid" corresponde a la firma PHP.longjmp.Remote.Code.Execution?',
        options: [
          { key: "a", label: "62657" },
          { key: "b", label: "62658" },
          { key: "c", label: "0419016384" }
        ],
        correctKey: "a",
        rationale:
          "62657 es longjmp (CVE-2026-109618) y 62658 es stale global state (CVE-2026-109619). El valor 0419… es el logid del evento, no el identificador de la firma."
      },
      {
        prompt: "¿Qué campo une el registro del motor de IPS con el registro de tráfico de la misma conversación?",
        options: [
          { key: "a", label: "policyid" },
          { key: "b", label: "logid" },
          { key: "c", label: "sessionid" }
        ],
        correctKey: "c",
        rationale:
          "El sessionid identifica el flujo. policyid dice qué política lo permitió y logid identifica el tipo de evento, pero ninguno de los dos une dos eventos distintos del mismo flujo."
      },
      {
        prompt: 'La firma disparó con "action=detected". ¿Qué hizo el motor?',
        options: [
          { key: "a", label: "Lo bloqueó y lo registró" },
          { key: "b", label: "Vio el ataque y no lo bloqueó" },
          { key: "c", label: "Lo desvió a cuarentena" }
        ],
        correctKey: "b",
        rationale:
          "detected significa detección sin bloqueo: el paquete siguió su camino. Por eso la cadena continúa y acaba apareciendo la web shell."
      },
      {
        prompt:
          "Si el motor de IPS hubiera estado en modo bloqueo, ¿qué habría cambiado en la cadena y qué evidencia habrías perdido?",
        options: [
          {
            key: "a",
            label:
              "Sí cambiaría: el bloqueo corta la sesión en la fase de explotación y desaparece toda la cadena posterior; la evidencia sería el evento de bloqueo, no la telemetría comprometida."
          },
          {
            key: "b",
            label:
              "No cambiaría: el volumen de alertas sería el mismo, porque el motor cuenta las intenciones del atacante tanto si se detiene la conexión como si no."
          },
          {
            key: "c",
            label:
              "Sí cambiaría: en modo bloqueo el cortafuegos deja de emitir eventos de tráfico y perderíamos también la evidencia de reconocimiento."
          }
        ],
        correctKey: "a",
        rationale:
          "Que la política sea detección es justo lo que permite que la conexión continúe tras el intento de explotación. Con bloqueo, la sesión muere antes del webshell, cuenta svc_web, C2 y exfiltración."
      }
    ]
  },
  {
    id: 3,
    title: "Instalación",
    moment: "Instalación",
    severity: "High",
    summary: "¿Qué deja dentro?",
    questions: [
      {
        prompt: "¿Qué proceso ejecuta la creación de la cuenta svc_web?",
        options: [
          { key: "a", label: "sshd, por una sesión remota" },
          { key: "b", label: "cron, por una tarea programada" },
          { key: "c", label: "php-fpm, el propio servidor web" }
        ],
        correctKey: "c",
        rationale:
          "La cuenta la crea el proceso del servidor web. Eso es lo que convierte una página vulnerable en una puerta trasera con credenciales propias."
      },
      {
        prompt: "¿En qué ruta se escribe la web shell?",
        options: [
          { key: "a", label: "/var/www/html" },
          { key: "b", label: "/tmp" },
          { key: "c", label: "/etc/php" }
        ],
        correctKey: "a",
        rationale:
          "Se escribe en el directorio servido por la web, de modo que queda accesible por HTTP. En /tmp no sería alcanzable desde fuera."
      },
      {
        prompt: 'Que un proceso web pueda ejecutar "useradd" incumple sobre todo un principio:',
        options: [
          { key: "a", label: "Mínimo privilegio" },
          { key: "b", label: "Defensa en profundidad" },
          { key: "c", label: "Segregación de redes" }
        ],
        correctKey: "a",
        rationale:
          "El proceso web no debería tener permiso para crear usuarios. Los otros dos principios también ayudan, pero el que se rompe aquí es el de mínimo privilegio."
      }
    ]
  },
  {
    id: 4,
    title: "Mando y control",
    moment: "Mando y control",
    severity: "High",
    summary: "¿A dónde llama?",
    questions: [
      {
        prompt: "¿Qué dos rasgos separan una baliza de una descarga normal?",
        options: [
          { key: "a", label: "El puerto de destino y el tamaño del paquete" },
          { key: "b", label: "El cifrado y el nombre del dominio" },
          { key: "c", label: "Conexiones pequeñas y una periodicidad regular" }
        ],
        correctKey: "c",
        rationale:
          "Una baliza pide órdenes y espera: envía poco y lo hace cada cierto tiempo. El volumen y la regularidad, no el puerto, es lo que la delata."
      },
      {
        prompt: "¿Por qué el destino 203.0.113.45 no debe enriquecerse como indicador de ataque?",
        options: [
          { key: "a", label: "Porque pertenece a un rango reservado para documentación" },
          { key: "b", label: "Porque es un activo propio del laboratorio, el VIP del servidor web" },
          { key: "c", label: "Porque no responde a ping" }
        ],
        correctKey: "b",
        rationale:
          "Es cierto el rango reservado, pero el criterio que manda es el otro: es una IP propia. En un SOC las IPs de la casa no se enriquecen como si fueran del atacante."
      }
    ]
  },
  {
    id: 5,
    title: "Exfiltración",
    moment: "Exfiltración",
    severity: "Medium",
    summary: "¿Qué se lleva y qué aprecia la IA?",
    questions: [
      {
        prompt: "La severidad del caso no coincide con la de sus alertas. ¿Quién la fija?",
        options: [
          { key: "a", label: "La alerta más grave del caso" },
          { key: "b", label: "El analista al abrirlo" },
          { key: "c", label: "La regla de escalado que crea el caso" }
        ],
        correctKey: "c",
        rationale:
          "Cada regla de escalado lleva su severidad. Por eso un caso puede ser Medium con alertas High y Critical dentro."
      },
      {
        prompt: "Las tres transferencias van creciendo. ¿Por qué eso es más sospechoso que tres envíos iguales?",
        options: [
          { key: "a", label: "Porque el total transferido es mayor" },
          { key: "b", label: "Porque el patrón sugiere una prueba y después un escalado" },
          { key: "c", label: "No es más sospechoso, es casualidad" }
        ],
        correctKey: "b",
        rationale:
          "Un envío pequeño seguido de otros mayores encaja con alguien que primero comprueba el canal. La progresión es la señal, no solo el volumen."
      }
    ]
  },
  {
    id: 6,
    title: "Auditoría de la IA",
    moment: "Auditoría",
    severity: "—",
    summary: "¿Dónde y cómo se ejecuta la IA?",
    questions: [
      {
        prompt: "¿Qué conector y qué operación llaman al modelo?",
        options: [
          { key: "a", label: "fortinet-fortiai-proxy con chat_completion" },
          { key: "b", label: "fortisoar-soc-simulator con create_simulated_alert" },
          { key: "c", label: "code-snippet con exec" }
        ],
        correctKey: "a",
        rationale:
          "El paso AI Evaluation for Impact Analysis usa fortinet-fortiai-proxy y la operación chat_completion."
      },
      {
        prompt: "Si el conector de IA deja de responder, ¿qué se pierde?",
        options: [
          { key: "a", label: "El caso completo" },
          { key: "b", label: "Las alertas que lo componen" },
          { key: "c", label: "El análisis de impacto, pero no el incidente" }
        ],
        correctKey: "c",
        rationale:
          "La IA escribe un campo del caso; si falla, ese campo queda vacío. El caso, sus alertas y sus activos siguen ahí y son investigables."
      }
    ]
  },
  {
    id: 7,
    title: "Movimiento lateral",
    moment: "Movimiento lateral",
    severity: "High",
    summary: "¿Hasta dónde llega y qué haces a mano?",
    questions: [
      {
        prompt:
          "Tras escalar el recon y el lateral a mano, etiquetas ambos casos con XPERTS26. ¿Por qué esa etiqueta importa?",
        options: [
          { key: "a", label: "Es la etiqueta que rebaja la prioridad del caso" },
          { key: "b", label: "La ponen las reglas automáticamente y el examen es verlo" },
          { key: "c", label: "Es el criterio de alcance con el que el informe del laboratorio decide qué casos reúne" }
        ],
        correctKey: "c",
        rationale:
          "El informe recupera casos por recordTags: XPERTS26. Sin etiqueta, tu caso no sale en el padrón ni en la tabla de casos del informe."
      },
      {
        prompt: "¿Qué dos puertos usan los dos saltos laterales?",
        options: [
          { key: "a", label: "3389 y 1433" },
          { key: "b", label: "22 y 3306" },
          { key: "c", label: "445 y 5432" }
        ],
        correctKey: "b",
        rationale:
          "El primero es SSH (administración remota) y el segundo MySQL (base de datos). Es la combinación típica de un salto desde el servidor web al de datos."
      },
      {
        prompt: "¿Qué dos evidencias ligan el salto lateral con la cuenta creada en la tarea 3?",
        options: [
          { key: "a", label: "El usuario svc_web y la cercanía en el tiempo con la creación de la cuenta" },
          { key: "b", label: "El nombre del caso y su severidad" },
          { key: "c", label: "El sessionid de los dos eventos" }
        ],
        correctKey: "a",
        rationale:
          "El usuario autenticado es svc_web, la cuenta que se creó minutos antes. Esa coincidencia es la que sostiene la atribución."
      }
    ]
  },
  {
    id: 8,
    title: "Informe y expediente",
    moment: "Cierre",
    severity: "—",
    summary: "¿Qué decides y qué entregas?",
    questions: [
      {
        prompt: "¿Dónde deja su trabajo XPERTS26_INFORME cuando se ejecuta?",
        options: [
          { key: "a", label: "Como PDF en la carpeta de descargas del analista" },
          { key: "b", label: "Como nota destacada dentro del caso desde el que se lanza" },
          { key: "c", label: "Como campo handleChange en el módulo de activos" }
        ],
        correctKey: "b",
        rationale:
          "Escribe un comentario con el incidente dentro del caso. El PDF se genera aparte con Generate Incident Summary Report."
      },
      {
        prompt: "El alcance del informe (qué casos recoge) se decide…",
        options: [
          { key: "a", label: "Por la etiqueta XPERTS26 del caso" },
          { key: "b", label: "Por la fecha de creación del caso" },
          { key: "c", label: "Por la severidad del caso" }
        ],
        correctKey: "a",
        rationale: "recordTags: XPERTS26 es el único criterio de recogida."
      },
      {
        prompt: "¿En qué punto de la cadena se habría cortado el ataque con menos esfuerzo?",
        options: [
          { key: "a", label: "En la exfiltración, bloqueando la salida" },
          { key: "b", label: "En la fase de explotación, aplicando IPS en modo bloqueo" },
          { key: "c", label: "En el reconocimiento, apagando el servidor" }
        ],
        correctKey: "b",
        rationale:
          "La firma ya estaba disponible y solo detectaba. Ponerla en bloqueo corta la cadena antes de la web shell, sin tocar el servicio ni la disponibilidad."
      }
    ]
  }
];
