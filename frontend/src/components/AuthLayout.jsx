/**
 * Marco visual de los recorridos públicos. Solo compone presentación:
 * los formularios conservan sus validaciones, estado y llamadas a la API.
 * La ilustración es decorativa y está excluida del árbol de accesibilidad.
 */
import {
  ArrowUpRight,
  Fingerprint,
  KeyRound,
  MailCheck,
  ShieldCheck,
} from "lucide-react";

const messages = {
  login: {
    eyebrow: "TU IDENTIDAD, EN UN SOLO LUGAR",
    title: "El espacio",
    emphasis: "que es tuyo.",
    description:
      "Entrá, conectá tus cuentas y gestioná tu información. Simple para vos. Cuidada en cada paso.",
    label: "Acceso personal",
  },
  register: {
    eyebrow: "EL COMIENZO DE TU ESPACIO",
    title: "Tu cuenta.",
    emphasis: "Más posibilidades.",
    description:
      "Un perfil propio, un correo verificado y distintas formas de entrar. Todo empieza con vos.",
    label: "Nueva identidad",
  },
  verify_email: {
    eyebrow: "UN PASO PARA CONTINUAR",
    title: "Confirmá",
    emphasis: "que sos vos.",
    description:
      "Un código de un solo uso conecta tu correo con tu cuenta. Tu próximo paso empieza acá.",
    label: "Verificación de correo",
  },
  unlock: {
    eyebrow: "VOLVÉ A TU ESPACIO",
    title: "El acceso,",
    emphasis: "en tus manos.",
    description:
      "Recibí un código para recuperar el acceso a tu cuenta, sin perder tu información.",
    label: "Recuperación de acceso",
  },
  reset_password: {
    eyebrow: "UN NUEVO PUNTO DE PARTIDA",
    title: "Renová",
    emphasis: "tu acceso.",
    description:
      "Verificá tu identidad y elegí una nueva contraseña. El resto de tu espacio sigue siendo tuyo.",
    label: "Nueva contraseña",
  },
};

/** variant selecciona textos de presentación; children conserva el formulario real. */
export function AuthLayout({ children, variant = "login" }) {
  const message = messages[variant] || messages.login;
  return (
    <section className={`auth-layout auth-layout--${variant}`}>
      <aside className="auth-story" aria-label="Tu espacio personal">
        <p className="eyebrow">{message.eyebrow}</p>
        <h2 className="auth-story__title">
          {message.title}
          <br />
          <em>{message.emphasis}</em>
        </h2>
        <p className="auth-story__description">{message.description}</p>
        <div className="identity-art" aria-hidden="true">
          <div className="identity-art__grid" />
          <div className="identity-art__orbit identity-art__orbit--outer" />
          <div className="identity-art__orbit identity-art__orbit--inner" />
          <div className="identity-art__core">
            <Fingerprint />
          </div>
          <span className="identity-art__node identity-art__node--top">
            <KeyRound />
          </span>
          <span className="identity-art__node identity-art__node--bottom">
            <MailCheck />
          </span>
          <div className="identity-art__caption">
            <span className="status-dot" />
            <span>{message.label}</span>
            <ArrowUpRight />
          </div>
        </div>
        <div className="auth-story__note">
          <ShieldCheck aria-hidden="true" />
          <p>
            Una cuenta. Distintas formas de conectar.
            <span>Vos elegís cómo entrar.</span>
          </p>
        </div>
      </aside>
      <div className="auth-body">{children}</div>
    </section>
  );
}
