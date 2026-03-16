'use client';

import { AlertTriangle } from 'lucide-react';

export default function DisclaimerPage() {
  return (
    <main 
      className="min-h-screen pt-32 pb-20 text-white selection:bg-purple-600/30 font-sans relative overflow-x-hidden"
      style={{
        backgroundImage: "url('/fono.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/50" />
      
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center gap-3 mb-16">
          <AlertTriangle className="w-16 h-16 text-yellow-600 animate-pulse bg-yellow-950/20 p-4 rounded-full border border-yellow-900/40" />
          <h1 className="text-5xl font-black italic tracking-tighter text-white drop-shadow-[0_0_30px_rgba(168,85,247,0.5)] uppercase">Disclaimer Legal</h1>
          <p className="text-lg text-gray-400 mt-4 text-center font-light">Información importante sobre Shadow Azeroth</p>
        </div>

        <div className="space-y-8">
          {/* Section 1: Not Affiliated with Blizzard */}
          <section className="p-8 bg-black/60 border border-yellow-900/30 rounded-sm backdrop-blur-md">
            <h2 className="text-2xl font-black text-yellow-600 mb-4 uppercase tracking-wide">No Afiliación con Blizzard Entertainment</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Shadow Azeroth <strong>no está afiliado, asociado, respaldado ni patrocinado</strong> por Blizzard Entertainment, Inc. 
              Todo lo relacionado con World of Warcraft, incluyendo pero no limitado a nombres, logos, personajes, y derechos de autor, 
              son propiedad exclusiva de Blizzard Entertainment, Inc.
            </p>
          </section>

          {/* Section 2: Educational Purpose */}
          <section className="p-8 bg-black/60 border border-purple-900/30 rounded-sm backdrop-blur-md">
            <h2 className="text-2xl font-black text-purple-600 mb-4 uppercase tracking-wide">Propósito Educativo y de Prueba</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Shadow Azeroth es un proyecto creado <strong>exclusivamente con fines educativos y de prueba</strong>. 
              Este servidor no es una entidad comercial oficial y no intenta replicar exactamente la experiencia comercial de World of Warcraft, 
              sino servir como ejemplo de cómo funciona la tecnología de servidor MMO.
            </p>
          </section>

          {/* Section 3: Donations vs. Sales */}
          <section className="p-8 bg-black/60 border border-purple-900/30 rounded-sm backdrop-blur-md">
            <h2 className="text-2xl font-black text-purple-600 mb-4 uppercase tracking-wide">Donaciones vs. Compras</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              <strong>IMPORTANTE:</strong> Todo lo mencionado como "donación" en Shadow Azeroth es una contribución voluntaria 
              para ayudar a mantener la infraestructura del servidor (VPS, ancho de banda, costos operacionales), 
              <strong>NO</strong> es una transacción comercial de compra de artículos o servicios.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed">
              Nunca utilizamos términos como "Tienda", "Comprar", "Vender" u otros vocablos comerciales. 
              Toda actividad se realiza bajo el término "Recompensas de Donación" para clarificar que es un acto voluntario de apoyo, 
              no una venta.
            </p>
          </section>

          {/* Section 4: Intellectual Property */}
          <section className="p-8 bg-black/60 border border-red-900/30 rounded-sm backdrop-blur-md">
            <h2 className="text-2xl font-black text-red-600 mb-4 uppercase tracking-wide">Derechos de Propiedad Intelectual</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Todos los nombres, logotipos, imágenes en movimiento, iconos, software, código fuente, y cualquier otro contenido 
              relacionado con World of Warcraft son propiedad de Blizzard Entertainment, Inc. Nos abstenemos completamente de 
              utilizar el logotipo exacto de "Wrath of the Lich King" y todos sus bordes distintivos de Blizzard. 
              En su lugar, utilizamos fuentes similares y diseño original que no infringen derechos de autor.
            </p>
          </section>

          {/* Section 5: Server Rights */}
          <section className="p-8 bg-black/60 border border-green-900/30 rounded-sm backdrop-blur-md">
            <h2 className="text-2xl font-black text-green-600 mb-4 uppercase tracking-wide">Derechos del Servidor</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Este servidor se basa en AzerothCore, un proyecto de código abierto. Agradecemos a la comunidad de AzerothCore 
              por su trabajo en la emulación del servidor MMO.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed">
              El contenido original creado por Shadow Azeroth (código de servidor personalizado, implementaciones específicas, 
              y sistemas propios) se reserva todos los derechos, pero se comparte únicamente para fines educativos dentro de esta plataforma.
            </p>
          </section>

          {/* Section 6: Responsibility Disclaimer */}
          <section className="p-8 bg-black/60 border border-orange-900/30 rounded-sm backdrop-blur-md">
            <h2 className="text-2xl font-black text-orange-600 mb-4 uppercase tracking-wide">Descargo de Responsabilidad</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              <strong>RIESGO LEGAL:</strong> Al utilizar Shadow Azeroth, el usuario reconoce y acepta que:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-400 text-sm">
              <li>Blizzard Entertainment podría solicitar el cese de operaciones de este servidor en cualquier momento</li>
              <li>Cualquier cuenta creada en Shadow Azeroth podría ser eliminada sin previo aviso</li>
              <li>Shadow Azeroth no es responsable de pérdida de datos, tiempo invertido en la plataforma, o cualquier daño derivado</li>
              <li>El contenido del servidor podría cambiar, degradarse o desaparecer sin garantía de mantenimiento</li>
            </ul>
          </section>

          {/* Section 7: Takedown Notices */}
          <section className="p-8 bg-black/60 border border-pink-900/30 rounded-sm backdrop-blur-md">
            <h2 className="text-2xl font-black text-pink-600 mb-4 uppercase tracking-wide">Notificaciones de Retirada</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Si Blizzard Entertainment o cualquier otra entidad requiere que se retire contenido de Shadow Azeroth, 
              cumpliremos completamente con cualquier notificación de DMCA (Digital Millennium Copyright Act) u otra solicitud legal 
              dentro de los límites establecidos por la ley.
            </p>
          </section>

          {/* Section 8: Community Guidelines */}
          <section className="p-8 bg-black/60 border border-cyan-900/30 rounded-sm backdrop-blur-md">
            <h2 className="text-2xl font-black text-cyan-600 mb-4 uppercase tracking-wide">Directrices de Comunidad</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Los usuarios de Shadow Azeroth aceptan:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-400 text-sm">
              <li>Usar el servidor únicamente con fines educativos y de entretenimiento personal</li>
              <li>No realizar actividades comerciales o de venta de cuentas/items</li>
              <li>Respetar el código de conducta de la comunidad</li>
              <li>No compartir información de otros jugadores sin consentimiento</li>
              <li>No utilizar herramientas de piratería, macros injustificadas, o modificaciones no autorizadas</li>
            </ul>
          </section>

          {/* Final Note */}
          <div className="p-8 bg-red-950/20 border border-red-900/50 rounded-sm backdrop-blur-md text-center">
            <p className="text-gray-300 text-sm font-light leading-relaxed italic">
              Este disclaimer está diseñado para proteger tanto a Shadow Azeroth como a sus usuarios. 
              Al acceder y usar este servidor, aceptas todos los términos aquí descritos.
            </p>
            <p className="text-gray-500 text-xs mt-4 font-bold uppercase tracking-widest">
              Última actualización: Marzo 2025
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
