/**
 * Página de ejemplo para consultar AzerothCore MySQL
 * Muestra personajes de la base de datos acore_characters
 */

import { getTableData } from '@/lib/bizzcms';

interface Character {
  guid: number;
  name: string;
  race: number;
  class: number;
  level: number;
  gender: number;
  skin: number;
  face: number;
  hairStyle: number;
  hairColor: number;
  facialStyle: number;
  createtime: string;
  deletetime: string | null;
}

// Mapeo de razas y clases
const RACES: { [key: number]: string } = {
  1: 'Humano', 2: 'Orco', 3: 'Enano', 4: 'Elfo Nocturno',
  5: 'No-Muerto', 6: 'Tauren', 7: 'Gnomo', 8: 'Troll',
  9: 'Goblin', 10: 'Draenei', 11: 'Élfo de Sangre',
  32: 'Pandaren'
};

const CLASSES: { [key: number]: string } = {
  1: 'Guerrero', 2: 'Paladín', 3: 'Cazador', 4: 'Pícaro',
  5: 'Sacerdote', 6: 'Caballero de la Muerte', 7: 'Chamán',
  8: 'Mago', 9: 'Brujo', 10: 'Monje', 11: 'Druida', 12: 'Cazador de Demonios'
};

export const revalidate = 60; // ISR: revalidar cada 60 segundos

export default async function CharactersPage() {
  let characters: Character[] = [];
  let error: string | null = null;

  try {
    // Obtener todos los personajes de la tabla 'characters'
    // Limitar a 100 para no sobrecargar
    characters = await getTableData<Character>('characters', {}, 100);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Error desconocido al conectar a MySQL';
    console.error('Error:', err);
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-white mb-4">
            Personajes AzerothCore
          </h1>
          <p className="text-gray-400 text-lg">
            Datos desde MySQL - acore_characters
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-900/50 border border-red-600 rounded-lg">
            <h2 className="text-red-400 font-bold mb-2">⚠️ Error de Conexión:</h2>
            <p className="text-red-300 mb-2">{error}</p>
            <div className="text-red-300 text-sm bg-black/30 p-3 rounded mt-3">
              <p className="font-mono">Verifica en .env.local:</p>
              <p>DB_HOST=127.0.0.1</p>
              <p>DB_PORT=3306</p>
              <p>DB_USER=blizzcms</p>
              <p>DB_NAME=acore_characters</p>
            </div>
          </div>
        )}

        {/* Characters Grid */}
        {characters.length > 0 ? (
          <div className="space-y-4">
            {/* Characters List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {characters.map((char) => (
                <div
                  key={char.guid}
                  className="bg-gradient-to-br from-purple-900/60 to-purple-800/30 border border-purple-600/50 rounded-lg p-6 hover:border-purple-400 transition-all hover:scale-105"
                >
                  {/* Nombre del personaje */}
                  <h2 className="text-2xl font-black text-yellow-400 mb-4">
                    {char.name}
                  </h2>

                  {/* Grid de información */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-black/30 p-3 rounded">
                      <p className="text-gray-400 text-xs">Raza</p>
                      <p className="text-white font-bold">
                        {RACES[char.race] || `ID: ${char.race}`}
                      </p>
                    </div>

                    <div className="bg-black/30 p-3 rounded">
                      <p className="text-gray-400 text-xs">Clase</p>
                      <p className="text-white font-bold">
                        {CLASSES[char.class] || `ID: ${char.class}`}
                      </p>
                    </div>

                    <div className="bg-black/30 p-3 rounded">
                      <p className="text-gray-400 text-xs">Nivel</p>
                      <p className="text-white font-black text-lg">{char.level}</p>
                    </div>

                    <div className="bg-black/30 p-3 rounded">
                      <p className="text-gray-400 text-xs">GUID</p>
                      <p className="text-white font-mono text-sm">{char.guid}</p>
                    </div>
                  </div>

                  {/* Fecha de creación */}
                  <div className="mt-4 pt-4 border-t border-purple-600/30">
                    <p className="text-gray-400 text-xs mb-1">Creado:</p>
                    <p className="text-white text-sm">
                      {new Date(char.createtime).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {/* Estado */}
                  {char.deletetime ? (
                    <div className="mt-3 p-2 bg-red-900/30 border border-red-600/50 rounded">
                      <p className="text-red-400 text-xs font-bold">
                        ✗ ELIMINADO
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 p-2 bg-green-900/30 border border-green-600/50 rounded">
                      <p className="text-green-400 text-xs font-bold">
                        ✓ ACTIVO
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : !error ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Cargando personajes...</p>
          </div>
        ) : null}

        {/* Empty State */}
        {characters.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              No hay personajes en la base de datos
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-12 p-6 bg-purple-900/20 border border-purple-600/30 rounded-lg">
          <h3 className="text-white font-bold mb-4">ℹ️ Información de Conexión:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
            <div>
              <p className="text-purple-400 font-bold">Base de Datos:</p>
              <p>acore_characters</p>
            </div>
            <div>
              <p className="text-purple-400 font-bold">Total de Personajes:</p>
              <p className="text-white font-black">{characters.length}</p>
            </div>
            <div>
              <p className="text-purple-400 font-bold">Estrategia:</p>
              <p>ISR (Incremental Static Regeneration)</p>
            </div>
            <div>
              <p className="text-purple-400 font-bold">Actualización:</p>
              <p>Cada 60 segundos</p>
            </div>
            <div className="col-span-2">
              <p className="text-purple-400 font-bold">Tipo:</p>
              <p>Server Component de Next.js 14/15 + MySQL2</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
