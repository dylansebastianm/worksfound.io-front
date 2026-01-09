import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Esta función se ejecuta en el servidor, por lo que puede usar OPENAI_API_KEY sin NEXT_PUBLIC_
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TranslateCVRequestBody {
  cvText: string;
  targetLanguage: 'es' | 'en';
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key no configurada' },
        { status: 500 }
      );
    }

    const body: TranslateCVRequestBody = await request.json();
    const { cvText, targetLanguage } = body;

    if (!cvText || !targetLanguage) {
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    // Extraer la sección SKILLS antes de traducir para preservarla intacta
    const skillsSectionPattern = /===SECTION_START:SKILLS===([\s\S]*?)===SECTION_END:SKILLS===/;
    const skillsMatch = cvText.match(skillsSectionPattern);
    const originalSkillsSection = skillsMatch ? skillsMatch[0] : null;

    const targetLangName = targetLanguage === 'es' ? 'español' : 'inglés';
    const sourceLangName = targetLanguage === 'es' ? 'inglés' : 'español';

    const prompt = `Eres un traductor profesional especializado en currículums vitae.

Tu tarea es traducir el CV completo del ${sourceLangName} al ${targetLangName}, manteniendo EXACTAMENTE:
- Todos los marcadores de sección (===SECTION_START:NAME=== y ===SECTION_END:NAME===)
- El formato de cada sección
- La estructura y organización
- Los bullet points (•)
- Los separadores (|)
- El formato de fechas y números
- Los nombres de empresas, instituciones y tecnologías (NO traducir nombres propios)
- Las URLs (LinkedIn, emails, etc.)

INSTRUCCIONES CRÍTICAS:
1. Traduce SOLO el contenido textual, manteniendo toda la estructura intacta
2. NO cambies ningún marcador de sección
3. NO cambies el formato de las fechas (mantén el formato original)
4. NO traduzcas nombres propios de empresas, instituciones, tecnologías o personas
5. NO traduzcas URLs, emails o números de teléfono
6. Traduce el contenido profesional manteniendo el tono y estilo apropiado para un CV
7. Si el CV ya está en ${targetLangName}, devuélvelo sin cambios
8. IMPORTANTE: La sección SKILLS debe mantenerse EXACTAMENTE como está, sin ninguna traducción. Los skills (React, JavaScript, Python, etc.) SIEMPRE deben permanecer en inglés y sin cambios. Solo traduce los nombres de las categorías (Frontend, Backend, etc.) si es necesario, pero NUNCA traduzcas los nombres de las tecnologías o herramientas.

CV A TRADUCIR:
${cvText}

Devuelve ÚNICAMENTE el CV traducido, sin explicaciones ni comentarios adicionales.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Eres un traductor profesional especializado en currículums vitae. Traduces contenido manteniendo toda la estructura y formato intactos. NUNCA traduces la sección SKILLS - los nombres de tecnologías deben permanecer siempre en inglés.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    let translatedCV = completion.choices[0]?.message?.content;

    // Si se extrajo la sección SKILLS original, reemplazar la traducida con la original
    if (originalSkillsSection && translatedCV) {
      const translatedSkillsPattern = /===SECTION_START:SKILLS===([\s\S]*?)===SECTION_END:SKILLS===/;
      if (translatedCV.match(translatedSkillsPattern)) {
        // Reemplazar la sección SKILLS traducida con la original
        translatedCV = translatedCV.replace(translatedSkillsPattern, originalSkillsSection);
      }
    }

    if (!translatedCV) {
      return NextResponse.json(
        { success: false, error: 'No se recibió el CV traducido' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      translatedCV,
    });
  } catch (error) {
    console.error('Error traduciendo CV:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al traducir CV',
      },
      { status: 500 }
    );
  }
}
