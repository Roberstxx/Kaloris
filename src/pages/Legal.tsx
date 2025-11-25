import React from "react";
import AppHeader from "@/components/ui/AppHeader";

const Legal: React.FC = () => {
  return (
    <div>
      <AppHeader />

      <main
        className="container"
        style={{
          paddingTop: "2rem",
          paddingBottom: "6rem",
          maxWidth: "960px",
        }}
      >
        {/* Encabezado principal */}
        <header
          style={{
            marginBottom: "2rem",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "2rem",
              letterSpacing: "-0.03em",
            }}
          >
            Información legal de Kaloris
          </h1>
          <p
            style={{
              marginTop: ".75rem",
              color: "var(--text-secondary)",
              fontSize: ".96rem",
              maxWidth: "640px",
              marginInline: "auto",
              lineHeight: 1.5,
            }}
          >
            Aquí encontrarás los <strong>Términos y Condiciones de Uso</strong> y la
            <strong> Política de Privacidad</strong> de la aplicación{" "}
            <strong>Kaloris</strong>, desarrollada por <strong>roberstxx</strong>.
          </p>

          {/* Navegación interna (scroll dentro de la página) */}
          <nav
            aria-label="Navegación legal"
            style={{
              marginTop: "1.5rem",
              display: "flex",
              flexWrap: "wrap",
              gap: ".75rem",
              justifyContent: "center",
            }}
          >
            <a
              href="#terminos"
              className="btn btn-secondary"
              style={{
                textDecoration: "none",
                paddingInline: "1.25rem",
                paddingBlock: ".55rem",
                borderRadius: "999px",
                fontSize: ".9rem",
              }}
            >
              Términos y Condiciones
            </a>
            <a
              href="#privacidad"
              className="btn btn-secondary"
              style={{
                textDecoration: "none",
                paddingInline: "1.25rem",
                paddingBlock: ".55rem",
                borderRadius: "999px",
                fontSize: ".9rem",
              }}
            >
              Política de Privacidad
            </a>
          </nav>

          <p
            style={{
              marginTop: ".75rem",
              color: "var(--text-tertiary)",
              fontSize: ".85rem",
            }}
          >
            Última actualización: 2025
          </p>
        </header>

        {/* Contenedor general con fondo suave */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.75rem",
          }}
        >
          {/* ===== TÉRMINOS Y CONDICIONES ===== */}
          <section
            id="terminos"
            className="card"
            style={{
              background: "var(--surface-elevated)",
              borderRadius: "var(--radius-lg, 16px)",
              border: "1px solid var(--border)",
              padding: "1.5rem 1.75rem",
              boxShadow: "var(--shadow-md, 0 10px 25px rgba(15,23,42,0.18))",
            }}
          >
            <header
              style={{
                borderBottom: "1px solid var(--border)",
                paddingBottom: ".75rem",
                marginBottom: "1.25rem",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.45rem",
                  letterSpacing: "-0.02em",
                }}
              >
                Términos y Condiciones de Uso
              </h2>
              <p
                style={{
                  margin: ".5rem 0 0",
                  color: "var(--text-secondary)",
                  fontSize: ".9rem",
                  lineHeight: 1.5,
                }}
              >
                El uso de Kaloris implica la aceptación de los siguientes
                Términos y Condiciones. Te recomendamos leerlos con atención.
              </p>
            </header>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                lineHeight: 1.6,
                fontSize: ".95rem",
              }}
            >
              <p>
                Bienvenido a <strong>Kaloris</strong>, una aplicación web orientada al
                registro nutricional diario, monitoreo de calorías y hábitos
                saludables. Al acceder o utilizar Kaloris, aceptas los presentes
                Términos y Condiciones de Uso. Si no estás de acuerdo con alguna
                parte, te recomendamos no utilizar la aplicación.
              </p>

              <div>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    margin: "0 0 .35rem",
                  }}
                >
                  1. Aceptación del usuario
                </h3>
                <p style={{ margin: 0 }}>
                  Al crear una cuenta, iniciar sesión o utilizar Kaloris, declaras que
                  has leído, comprendido y aceptado estos Términos y Condiciones. Si
                  utilizas la app en nombre de otra persona u organización, garantizas
                  que cuentas con la autorización correspondiente.
                </p>
              </div>

              <div>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    margin: "0 0 .35rem",
                  }}
                >
                  2. Servicios proporcionados
                </h3>
                <p style={{ marginTop: 0 }}>
                  Kaloris permite, entre otros:
                </p>
                <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
                  <li>Registrar alimentos, calorías y macronutrientes.</li>
                  <li>Calcular una estimación del gasto energético diario (TDEE).</li>
                  <li>Consultar el historial de comidas y metas diarias.</li>
                  <li>Visualizar resúmenes o reportes básicos.</li>
                  <li>Configurar datos físicos y objetivos personales.</li>
                </ul>
                <p style={{ marginTop: ".5rem" }}>
                  Kaloris es una herramienta de apoyo y no reemplaza el consejo de
                  profesionales de la salud, nutriólogos o médicos. Cualquier decisión
                  sobre tu salud es responsabilidad tuya.
                </p>
              </div>

              <div>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    margin: "0 0 .35rem",
                  }}
                >
                  3. Requisitos de uso
                </h3>
                <p style={{ marginTop: 0 }}>
                  El usuario se compromete a utilizar Kaloris de forma responsable y
                  conforme a la legislación aplicable. En particular, se prohíbe:
                </p>
                <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
                  <li>
                    Proporcionar información falsa, incompleta o desactualizada de
                    forma intencional.
                  </li>
                  <li>
                    Intentar vulnerar la seguridad, integridad o disponibilidad de la
                    aplicación o sus servicios asociados.
                  </li>
                  <li>
                    Utilizar Kaloris para actividades ilícitas, abusivas o no
                    autorizadas.
                  </li>
                </ul>
              </div>

              <div>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    margin: "0 0 .35rem",
                  }}
                >
                  4. Cuenta del usuario
                </h3>
                <p style={{ marginTop: 0 }}>
                  Para utilizar Kaloris, se requiere una cuenta asociada a un correo
                  electrónico. El usuario es responsable de:
                </p>
                <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
                  <li>Mantener la confidencialidad de su contraseña.</li>
                  <li>
                    Notificar si detecta accesos no autorizados o actividad sospechosa.
                  </li>
                  <li>Cerrar sesión en dispositivos compartidos cuando termine.</li>
                </ul>
                <p style={{ marginTop: ".5rem" }}>
                  Nos reservamos el derecho de suspender o limitar el acceso si
                  detectamos uso indebido, violaciones a estos Términos o riesgos para
                  la seguridad del sistema.
                </p>
              </div>

              <div>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    margin: "0 0 .35rem",
                  }}
                >
                  5. Limitación de responsabilidad
                </h3>
                <p style={{ marginTop: 0 }}>
                  Aunque buscamos ofrecer un servicio estable y confiable, Kaloris se
                  proporciona “tal cual” y “según disponibilidad”. En particular:
                </p>
                <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
                  <li>
                    No garantizamos la exactitud absoluta de todos los valores
                    nutricionales.
                  </li>
                  <li>
                    No garantizamos la disponibilidad ininterrumpida de la aplicación.
                  </li>
                  <li>
                    No asumimos responsabilidad por decisiones de salud o resultados
                    físicos derivados del uso de la app.
                  </li>
                </ul>
                <p style={{ marginTop: ".5rem" }}>
                  El uso de Kaloris es bajo la responsabilidad del usuario. Ante dudas
                  médicas o nutricionales, consulta siempre a un profesional.
                </p>
              </div>

              <div>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    margin: "0 0 .35rem",
                  }}
                >
                  6. Propiedad intelectual
                </h3>
                <p style={{ marginTop: 0 }}>
                  El diseño, código, nombre, logotipos y demás elementos asociados a{" "}
                  <strong>Kaloris</strong> son propiedad de{" "}
                  <strong>roberstxx</strong> o de sus respectivos titulares.
                  Queda prohibido:
                </p>
                <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
                  <li>Copiar o reproducir la aplicación de forma no autorizada.</li>
                  <li>Revender o redistribuir el servicio como propio.</li>
                  <li>
                    Utilizar la marca o elementos distintivos sin consentimiento
                    previo y por escrito.
                  </li>
                </ul>
              </div>

              <div>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    margin: "0 0 .35rem",
                  }}
                >
                  7. Modificaciones al servicio
                </h3>
                <p style={{ marginTop: 0 }}>
                  Podemos actualizar, modificar o descontinuar funcionalidades de
                  Kaloris cuando sea necesario, por razones técnicas, de seguridad o
                  de mejora del servicio. Procuraremos que los cambios no afecten
                  negativamente tus datos sin previo aviso razonable.
                </p>
              </div>

              <div>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    margin: "0 0 .35rem",
                  }}
                >
                  8. Cambios en estos Términos
                </h3>
                <p style={{ marginTop: 0 }}>
                  Podremos actualizar estos Términos y Condiciones en cualquier
                  momento. La versión vigente estará siempre disponible en esta
                  página, indicando la fecha de última actualización. El uso continuo
                  de la app tras dichos cambios implica tu aceptación de los mismos.
                </p>
              </div>

              <div>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    margin: "0 0 .35rem",
                  }}
                >
                  9. Contacto
                </h3>
                <p style={{ margin: 0 }}>
                  Para cualquier duda relacionada con estos Términos y Condiciones,
                  puedes escribirnos a:
                </p>
                <p style={{ margin: ".25rem 0 0" }}>
                  <strong>Correo de contacto:</strong> rbertsxx942@gmail.com
                </p>
              </div>
            </div>
          </section>

          {/* ===== POLÍTICA DE PRIVACIDAD ===== */}
          <section
            id="privacidad"
            className="card"
            style={{
              background: "var(--surface-elevated)",
              borderRadius: "var(--radius-lg, 16px)",
              border: "1px solid var(--border)",
              padding: "1.5rem 1.75rem",
              boxShadow: "var(--shadow-md, 0 10px 25px rgba(15,23,42,0.18))",
            }}
          >
            <header
              style={{
                borderBottom: "1px solid var(--border)",
                paddingBottom: ".75rem",
                marginBottom: "1.25rem",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.45rem",
                  letterSpacing: "-0.02em",
                }}
              >
                Política de Privacidad
              </h2>
              <p
                style={{
                  margin: ".5rem 0 0",
                  color: "var(--text-secondary)",
                  fontSize: ".9rem",
                  lineHeight: 1.5,
                }}
              >
                En Kaloris respetamos tu privacidad. Esta política explica qué
                datos recopilamos, cómo los utilizamos y cuáles son tus opciones.
              </p>
            </header>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                lineHeight: 1.6,
                fontSize: ".95rem",
              }}
            >
              <p>
                En <strong>Kaloris</strong> respetamos y protegemos tu privacidad.
                Esta Política explica qué datos recopilamos, cómo los utilizamos y
                cuáles son tus opciones respecto a tu información personal.
              </p>

              <div>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    margin: "0 0 .35rem",
                  }}
                >
                  1. Datos que recopilamos
                </h3>

                <h4
                  style={{
                    fontSize: ".98rem",
                    margin: ".25rem 0",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  1.1. Datos proporcionados por el usuario
                </h4>
                <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
                  <li>Nombre o alias (opcional).</li>
                  <li>Correo electrónico.</li>
                  <li>Foto de perfil (opcional).</li>
                  <li>
                    Datos físicos: sexo, edad, peso, altura y nivel de actividad
                    (según lo que ingreses).
                  </li>
                  <li>
                    Registros nutricionales: alimentos, calorías, macronutrientes,
                    metas y otra información que decidas guardar en la app.
                  </li>
                </ul>

                <h4
                  style={{
                    fontSize: ".98rem",
                    margin: ".75rem 0 .25rem",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  1.2. Datos técnicos
                </h4>
                <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
                  <li>Identificador de usuario generado por Firebase.</li>
                  <li>Fechas y horas de acceso.</li>
                  <li>
                    Información almacenada localmente en tu dispositivo (por
                    ejemplo, usando <code>localStorage</code> para mejorar el
                    rendimiento).
                  </li>
                </ul>

                <p style={{ marginTop: ".5rem" }}>
                  No solicitamos ni tratamos datos clínicos complejos ni información
                  sensible adicional sin tu consentimiento expreso.
                </p>
              </div>

              <div>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    margin: "0 0 .35rem",
                  }}
                >
                  2. Finalidad del tratamiento de datos
                </h3>
                <p style={{ marginTop: 0 }}>Utilizamos tus datos personales para:</p>
                <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
                  <li>Crear y mantener tu cuenta de usuario.</li>
                  <li>
                    Mostrar tus datos físicos y nutricionales dentro de la aplicación.
                  </li>
                  <li>
                    Sincronizar tus registros entre dispositivos compatibles.
                  </li>
                  <li>
                    Mejorar la experiencia de uso y la funcionalidad de Kaloris.
                  </li>
                </ul>
                <p style={{ marginTop: ".5rem" }}>
                  No vendemos tu información personal a terceros. El tratamiento se
                  limita a lo necesario para el funcionamiento de la app y mejoras
                  relacionadas.
                </p>
              </div>

              <div>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    margin: "0 0 .35rem",
                  }}
                >
                  3. Dónde se almacenan tus datos
                </h3>
                <p style={{ marginTop: 0 }}>
                  Los datos pueden almacenarse y procesarse en servicios de terceros
                  que utilizamos como infraestructura:
                </p>
                <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
                  <li>
                    <strong>Firebase</strong> (autenticación, base de datos,
                    almacenamiento).
                  </li>
                  <li>
                    <strong>Cloudinary</strong> (almacenamiento de fotos de perfil,
                    en caso de que subas una).
                  </li>
                </ul>
                <p style={{ marginTop: ".5rem" }}>
                  Estos proveedores cuentan con medidas de seguridad y estándares
                  reconocidos a nivel internacional. Aun así, ningún sistema es 100%
                  invulnerable.
                </p>
              </div>

              <div>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    margin: "0 0 .35rem",
                  }}
                >
                  4. Compartición de datos
                </h3>
                <p style={{ marginTop: 0 }}>
                  Podremos compartir información únicamente en los siguientes casos:
                </p>
                <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
                  <li>
                    Con servicios de infraestructura necesarios para operar la app
                    (como los mencionados anteriormente).
                  </li>
                  <li>
                    Cuando lo exija la ley o una autoridad competente, previa orden
                    legal.
                  </li>
                </ul>
                <p style={{ marginTop: ".5rem" }}>
                  No compartimos tu información con fines de marketing de terceros
                  ajenos a Kaloris.
                </p>
              </div>

              <div>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    margin: "0 0 .35rem",
                  }}
                >
                  5. Seguridad
                </h3>
                <p style={{ marginTop: 0 }}>
                  Implementamos medidas de seguridad razonables, como el uso de
                  conexiones cifradas (<strong>HTTPS</strong>) y reglas de acceso en
                  Firebase para proteger tus datos. Sin embargo, ningún sistema es
                  completamente inmune a riesgos de seguridad.
                </p>
              </div>

              <div>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    margin: "0 0 .35rem",
                  }}
                >
                  6. Conservación y eliminación de datos
                </h3>
                <p style={{ marginTop: 0 }}>
                  Conservamos tus datos mientras mantengas una cuenta activa en
                  Kaloris. Si lo deseas, puedes solicitar la eliminación de tu cuenta
                  y de la información asociada.
                </p>
                <p style={{ marginTop: ".5rem" }}>
                  Para ejercer este derecho, puedes escribirnos a{" "}
                  <strong>rbertsxx942@gmail.com</strong> indicando la solicitud de
                  eliminación de cuenta. Podríamos pedirte verificar tu identidad
                  antes de proceder.
                </p>
              </div>

              <div>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    margin: "0 0 .35rem",
                  }}
                >
                  7. Tus derechos
                </h3>
                <p style={{ marginTop: 0 }}>
                  Dependiendo de tu jurisdicción, podrías contar con derechos como:
                </p>
                <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
                  <li>Acceder a los datos personales que almacenamos sobre ti.</li>
                  <li>Solicitar la corrección de información inexacta o incompleta.</li>
                  <li>Solicitar la eliminación de tu información personal.</li>
                  <li>
                    Retirar tu consentimiento en determinados tratamientos, cuando
                    aplique.
                  </li>
                </ul>
              </div>

              <div>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    margin: "0 0 .35rem",
                  }}
                >
                  8. Cambios en esta Política de Privacidad
                </h3>
                <p style={{ marginTop: 0 }}>
                  Podremos actualizar esta Política de Privacidad para reflejar
                  cambios legales, técnicos o en el funcionamiento de Kaloris. La
                  versión vigente estará siempre disponible en esta página, con la
                  fecha de última actualización indicada arriba.
                </p>
              </div>

              <div>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    margin: "0 0 .35rem",
                  }}
                >
                  9. Contacto
                </h3>
                <p style={{ margin: 0 }}>
                  Si tienes preguntas sobre esta Política de Privacidad o sobre cómo
                  tratamos tus datos personales, puedes contactarnos en:
                </p>
                <p style={{ margin: ".25rem 0 0" }}>
                  <strong>Correo de contacto:</strong> rbertsxx942@gmail.com
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Legal;
