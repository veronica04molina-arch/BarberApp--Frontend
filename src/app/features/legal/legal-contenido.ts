export interface ItemLegal {
  etiqueta?: string;
  texto: string;
}

export interface SeccionLegal {
  titulo: string;
  parrafos?: string[];
  items?: ItemLegal[];
  cierre?: string;
}

export interface DocumentoLegal {
  titulo: string;
  subtitulo: string;
  intro: string;
  actualizado: string;
  secciones: SeccionLegal[];
}

export const PRIVACIDAD: DocumentoLegal = {
  titulo: 'Política de Privacidad',
  subtitulo: 'BarberApp — Sistema de agendamiento de citas',
  actualizado: '30 de septiembre de 2026',
  intro:
    'En BarberApp nos comprometemos a proteger tu privacidad y a tratar tus datos personales con responsabilidad y transparencia. Esta Política de Privacidad describe qué información recopilamos, cómo la usamos y qué derechos tienes sobre ella.',
  secciones: [
    {
      titulo: 'Información que recopilamos',
      parrafos: ['Al registrarte y utilizar BarberApp, recopilamos los siguientes datos personales:'],
      items: [
        { etiqueta: 'Datos de registro', texto: 'nombre completo, dirección de correo electrónico y número de teléfono. La contraseña se guarda cifrada.' },
        { etiqueta: 'Cuenta de Google', texto: 'si te registras con Google, recibimos tu nombre y tu correo verificado. No accedemos a tu contraseña de Google.' },
        { etiqueta: 'Datos de uso', texto: 'historial de citas agendadas, servicios seleccionados, barbero asignado, fechas y horarios de reservación.' },
        { etiqueta: 'Datos técnicos', texto: 'dirección IP, tipo de dispositivo, navegador y sistema operativo utilizados para acceder a la plataforma.' },
      ],
      cierre:
        'No recopilamos información financiera como números de tarjetas de crédito directamente; en caso de implementarse pagos en línea, estos serán procesados por plataformas de pago certificadas.',
    },
    {
      titulo: 'Para qué usamos tus datos',
      parrafos: ['Usamos tu información para:'],
      items: [
        { texto: 'Crear y administrar tu cuenta y verificar tu identidad al iniciar sesión.' },
        { texto: 'Agendar, mostrar y cancelar tus citas, y comunicarte información relacionada con ellas.' },
        { texto: 'Mantener la seguridad de la plataforma y prevenir usos indebidos.' },
      ],
    },
    {
      titulo: 'Autorización',
      parrafos: [
        'Tratamos tus datos con tu autorización previa, expresa e informada, que otorgas al marcar la casilla de aceptación al registrarte, conforme a la Ley 1581 de 2012 y sus decretos reglamentarios. Puedes revocarla en cualquier momento escribiéndonos.',
      ],
    },
    {
      titulo: 'Con quién compartimos tus datos',
      items: [
        { etiqueta: 'Barbero', texto: 'el barbero que elijas puede ver tu nombre, los servicios, la fecha, la hora y las notas de tus citas con él.' },
        { etiqueta: 'Google', texto: 'interviene únicamente para autenticarte cuando eliges registrarte o ingresar con tu cuenta de Google.' },
      ],
      cierre: 'No vendemos tus datos. Solo los entregaremos a una autoridad cuando la ley lo exija.',
    },
    {
      titulo: 'Seguridad',
      parrafos: [
        'Aplicamos medidas como el cifrado de contraseñas, sesiones con token y control de acceso según el rol del usuario. Ningún sistema es totalmente infalible, pero trabajamos para proteger tu información.',
      ],
    },
    {
      titulo: 'Conservación de los datos',
      parrafos: [
        'Conservamos tus datos mientras tu cuenta esté activa y durante el tiempo necesario para cumplir obligaciones legales. Puedes solicitar la supresión de tu cuenta y tus datos escribiéndonos.',
      ],
    },
    {
      titulo: 'Tus derechos',
      parrafos: ['Como titular de los datos tienes derecho a:'],
      items: [
        { texto: 'Conocer, actualizar y rectificar tus datos personales.' },
        { texto: 'Solicitar prueba de la autorización otorgada.' },
        { texto: 'Ser informado del uso que se le ha dado a tus datos.' },
        { texto: 'Revocar la autorización o solicitar la supresión de tus datos.' },
        { texto: 'Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).' },
      ],
    },
    {
      titulo: 'Consultas y reclamos',
      parrafos: [
        'Para ejercer tus derechos escríbenos a barberapp.soporte@gmail.com. Las consultas se responden en un máximo de 10 días hábiles y los reclamos en un máximo de 15 días hábiles, prorrogables en los términos de la ley.',
      ],
    },
    {
      titulo: 'Almacenamiento en tu navegador',
      parrafos: [
        'Guardamos en tu navegador el token de sesión para mantenerte conectado y se elimina al cerrar sesión. No usamos cookies con fines publicitarios.',
      ],
    },
    {
      titulo: 'Menores de edad',
      parrafos: ['BarberApp no está dirigida a menores de 18 años y no recopilamos sus datos de forma intencional.'],
    },
    {
      titulo: 'Cambios en esta política',
      parrafos: [
        'Si actualizamos esta política, publicaremos la nueva versión en esta página con su fecha de actualización. Para cualquier duda, escríbenos a barberapp.soporte@gmail.com.',
      ],
    },
  ],
};

export const TERMINOS: DocumentoLegal = {
  titulo: 'Términos y Condiciones',
  subtitulo: 'BarberApp — Sistema de agendamiento de citas',
  actualizado: '30 de septiembre de 2026',
  intro:
    'Al crear una cuenta o usar BarberApp aceptas estos términos. Léelos con atención: explican cómo funciona el servicio y las reglas para usarlo.',
  secciones: [
    {
      titulo: 'Aceptación de los términos',
      parrafos: [
        'Al registrarte o usar BarberApp declaras que has leído y aceptas estos Términos y Condiciones y la Política de Privacidad. Si no estás de acuerdo, no uses la plataforma.',
      ],
    },
    {
      titulo: 'Descripción del servicio',
      parrafos: [
        'BarberApp es una plataforma que permite a los clientes agendar citas con barberos. La prestación del servicio de barbería es responsabilidad exclusiva del barbero que atiende la cita.',
      ],
    },
    {
      titulo: 'Registro y cuenta',
      parrafos: ['Para usar la plataforma debes crear una cuenta, con estas condiciones:'],
      items: [
        { etiqueta: 'Edad', texto: 'debes ser mayor de 18 años.' },
        { etiqueta: 'Información veraz', texto: 'nombre completo, correo y teléfono deben ser reales y estar actualizados.' },
        { etiqueta: 'Registro con Google', texto: 'puedes registrarte con tu cuenta de Google; igualmente defines una contraseña para ingresar con tu correo.' },
        { etiqueta: 'Seguridad', texto: 'tu cuenta es personal. Eres responsable de proteger tus credenciales y de avisarnos si detectas un uso no autorizado.' },
      ],
    },
    {
      titulo: 'Agendamiento de citas',
      parrafos: ['Al reservar una cita ten en cuenta lo siguiente:'],
      items: [
        { etiqueta: 'Selección', texto: 'eliges un barbero y hasta 3 de sus servicios.' },
        { etiqueta: 'Horario', texto: 'la fecha y la hora disponibles dependen de la agenda del barbero.' },
        { etiqueta: 'Estado', texto: 'la cita queda registrada como pendiente hasta que el barbero la gestione.' },
        { etiqueta: 'Cancelación', texto: 'puedes cancelarla desde Mis citas, preferiblemente con antelación para que otro cliente tome ese horario.' },
        { etiqueta: 'Puntualidad', texto: 'te pedimos llegar a tiempo; la demora puede afectar la atención.' },
      ],
    },
    {
      titulo: 'Precios y pagos',
      parrafos: [
        'Los precios y la duración de los servicios los define cada barbero y se muestran en pesos colombianos. BarberApp no procesa pagos en línea: el servicio se paga directamente al barbero.',
      ],
    },
    {
      titulo: 'Uso aceptable',
      parrafos: ['No está permitido:'],
      items: [
        { texto: 'Suplantar a otra persona ni registrar datos falsos.' },
        { texto: 'Reservar citas sin intención de asistir o de forma abusiva.' },
        { texto: 'Intentar vulnerar la seguridad de la plataforma o acceder a ella con medios automatizados.' },
      ],
    },
    {
      titulo: 'Responsabilidades de los barberos',
      parrafos: [
        'Los barberos se comprometen a mantener actualizados sus servicios, precios y horarios, y a atender las citas confirmadas.',
      ],
    },
    {
      titulo: 'Propiedad intelectual',
      parrafos: [
        'La marca, el diseño y el software de BarberApp pertenecen a su titular. No puedes copiarlos, modificarlos ni reutilizarlos sin autorización.',
      ],
    },
    {
      titulo: 'Limitación de responsabilidad',
      parrafos: [
        'BarberApp se ofrece tal como está y no garantiza que funcione sin interrupciones. No respondemos por la calidad del servicio que presta cada barbero, sin perjuicio de los derechos que la ley reconoce a los consumidores.',
      ],
    },
    {
      titulo: 'Suspensión y cierre de cuentas',
      parrafos: [
        'Podemos suspender o cerrar las cuentas que incumplan estos términos. Tú también puedes solicitar el cierre de tu cuenta escribiéndonos.',
      ],
    },
    {
      titulo: 'Protección de datos personales',
      parrafos: [
        'El tratamiento de tus datos se rige por nuestra Política de Privacidad, disponible en la página Privacidad.',
      ],
    },
    {
      titulo: 'Cambios, ley aplicable y contacto',
      parrafos: [
        'Podemos actualizar estos términos y publicaremos la versión vigente en esta página. Se rigen por las leyes de la República de Colombia. Si tienes preguntas escríbenos a barberapp.soporte@gmail.com.',
      ],
    },
  ],
};
