import { Link } from "react-router-dom";
import { Shield, ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import logo from "@/assets/logo.gif";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between py-3">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Preescolar SonSoles escudo" width={48} height={48} className="h-12 w-12" />
            <span className="font-display text-xl text-ink hidden sm:block" style={{ fontFamily: "'SoupBone', serif", fontWeight: 600 }}>Preescolar SonSoles</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </Link>
        </div>
      </header>

      <main className="container max-w-3xl py-16 md:py-24">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl text-ink" style={{ fontFamily: "'SoupBone', serif", fontWeight: 600 }}>
            Política de Privacidad
          </h1>
        </div>

        <p className="text-muted-foreground mb-10">
          Última actualización: {new Date().toLocaleDateString("es-PR", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="prose prose-lg max-w-none text-ink/90 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-ink mb-3" style={{ fontFamily: "'Sour Gummy', sans-serif" }}>1. Introducción</h2>
            <p>
              Preescolar SonSoles (&ldquo;nosotros&rdquo;, &ldquo;nuestra&rdquo; o &ldquo;la escuelita&rdquo;) respeta tu privacidad y se compromete a proteger la información personal de las familias que confían en nosotros. Esta política explica cómo recopilamos, usamos y protegemos tu información.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-3" style={{ fontFamily: "'Sour Gummy', sans-serif" }}>2. Información que recopilamos</h2>
            <p>Podemos recopilar la siguiente información:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Nombre del padre, madre o tutor legal y del estudiante.</li>
              <li>Información de contacto: correo electrónico, número de teléfono y dirección postal.</li>
              <li>Información proporcionada a través de formularios de inscripción, entrevistas o comunicaciones directas.</li>
              <li>Datos de navegación anónimos mediante cookies para mejorar la experiencia del sitio web.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-3" style={{ fontFamily: "'Sour Gummy', sans-serif" }}>3. Uso de la información</h2>
            <p>Utilizamos la información recopilada para:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Procesar solicitudes de admisión y matrícula.</li>
              <li>Comunicarnos contigo sobre actividades escolares, eventos y asuntos administrativos.</li>
              <li>Proveer acceso al Portal de Padres y a los recursos educativos.</li>
              <li>Mejorar nuestros servicios y la experiencia del usuario en el sitio web.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-3" style={{ fontFamily: "'Sour Gummy', sans-serif" }}>4. Protección de la información</h2>
            <p>
              Implementamos medidas de seguridad razonables para proteger la información personal contra acceso no autorizado, alteración, divulgación o destrucción. Sin embargo, ninguna transmisión por Internet es completamente segura, por lo que no podemos garantizar seguridad absoluta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-3" style={{ fontFamily: "'Sour Gummy', sans-serif" }}>5. Compartir información con terceros</h2>
            <p>
              No vendemos, alquilamos ni compartimos tu información personal con terceros para fines de marketing. Podemos compartir datos con proveedores de servicios que nos ayudan a operar el sitio web o la escuela (por ejemplo, plataformas de correo electrónico o almacenamiento en la nube), siempre bajo acuerdos de confidencialidad.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-3" style={{ fontFamily: "'Sour Gummy', sans-serif" }}>6. Derechos de los padres y tutores</h2>
            <p>
              Como padre, madre o tutor legal, tienes derecho a acceder, corregir o solicitar la eliminación de la información personal de tu familia que tenemos en nuestros registros. Para ejercer estos derechos, contáctanos directamente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-3" style={{ fontFamily: "'Sour Gummy', sans-serif" }}>7. Cambios a esta política</h2>
            <p>
              Podemos actualizar esta política ocasionalmente. Cualquier cambio será publicado en esta página con la fecha de actualización correspondiente. Te recomendamos revisarla periódicamente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-3" style={{ fontFamily: "'Sour Gummy', sans-serif" }}>8. Contacto</h2>
            <p className="mb-4">
              Si tienes preguntas sobre esta política de privacidad, puedes comunicarte con nosotros:
            </p>
            <div className="bg-card rounded-2xl p-6 space-y-3 shadow-soft">
              <a href="mailto:preescolarsonsoles@gmail.com" className="flex items-center gap-3 text-ink hover:text-primary transition-colors">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span className="break-all">preescolarsonsoles@gmail.com</span>
              </a>
              <a href="tel:7879935623" className="flex items-center gap-3 text-ink hover:text-primary transition-colors">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span>(787) 993-5623</span>
              </a>
              <div className="flex items-start gap-3 text-ink">
                <MapPin className="h-5 w-5 text-primary shrink-1 mt-0.5" />
                <span>Carretera 176 Km 4.2, Esquina Pío Baroja, Cupey Alto, Río Piedras, Puerto Rico</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-ink text-ink-foreground py-8">
        <div className="container text-center text-xs opacity-90">
          © {new Date().getFullYear()} Preescolar SonSoles. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
