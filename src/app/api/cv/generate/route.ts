import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getCVPrompt } from '@/lib/cv-prompt';

// Esta función se ejecuta en el servidor, por lo que puede usar OPENAI_API_KEY sin NEXT_PUBLIC_
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerateCVRequestBody {
  cvRawContent: string;
  jobTitle: string;
  userProfile: {
    name: string;
    lastName: string;
    email: string;
    phone: string;
    country: string;
    city: string;
    age: string;
    gender: string;
    experienceYears: string;
    englishLevel: string;
    currentSalary: string;
    expectedSalary: string;
    institution: string;
    degreeTitle: string;
    educationTitle?: string;
    preferredWorkModality: string[];
    jobChangeReason: string;
    skills?: Array<{
      skill_key: string;
      label: string;
      years: string;
    }>;
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'API key de OpenAI no configurada' },
        { status: 500 }
      );
    }

    const body: GenerateCVRequestBody = await request.json();
    const { cvRawContent, jobTitle, userProfile } = body;

    if (!cvRawContent || !jobTitle || !userProfile) {
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    // Construir el prompt mejorado
    const skillsText = userProfile.skills 
      ? userProfile.skills.map(s => `${s.label} (${s.years} años)`).join(', ')
      : 'No especificado';

    const userInfoText = `
INFORMACIÓN DEL USUARIO:
- Nombre completo: ${userProfile.name} ${userProfile.lastName}
- Email: ${userProfile.email}
- Teléfono: ${userProfile.phone || 'No especificado'}
- Ubicación: ${userProfile.city || 'No especificado'}, ${userProfile.country || 'No especificado'}
- Edad: ${userProfile.age || 'No especificado'}
- Género: ${userProfile.gender || 'No especificado'}
- Años de experiencia: ${userProfile.experienceYears || 'No especificado'}
- Nivel de inglés: ${userProfile.englishLevel || 'No especificado'}
- Salario actual: ${userProfile.currentSalary || 'No especificado'}
- Salario esperado: ${userProfile.expectedSalary || 'No especificado'}
- Institución educativa: ${userProfile.institution || 'No especificado'}
- Título (degreeTitle): ${userProfile.degreeTitle || 'No especificado'}
- Título de educación (educationTitle): ${userProfile.educationTitle || 'No especificado'}
- Modalidad de trabajo preferida: ${userProfile.preferredWorkModality?.join(', ') || 'No especificado'}
- Razón de cambio de trabajo: ${userProfile.jobChangeReason || 'No especificado'}
- Habilidades técnicas: ${skillsText}
`;

    // Obtener el prompt desde el archivo modularizado
    const prompt = getCVPrompt({
      jobTitle,
      userName: userProfile.name,
      userLastName: userProfile.lastName,
      userEmail: userProfile.email,
      userPhone: userProfile.phone || '',
      userInstitution: userProfile.institution,
      userDegreeTitle: userProfile.degreeTitle,
      userEducationTitle: userProfile.educationTitle,
      userInfoText,
    });

    // Construir el mensaje completo
    const fullPrompt = `${prompt}

---CV_RAW---
${cvRawContent}
---END_CV_RAW---

---JOB_POSITION---
${jobTitle}
---END_JOB_POSITION---`;

    // Llamar a OpenAI (manteniendo el formato exacto del código original)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: fullPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const cvContent = completion.choices[0]?.message?.content;

    if (!cvContent) {
      return NextResponse.json(
        { success: false, error: 'No se generó contenido del CV' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      cvContent,
    });
  } catch (error) {
    console.error('Error generando CV:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al generar CV',
      },
      { status: 500 }
    );
  }
}
