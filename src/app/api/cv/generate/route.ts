import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
    const body: GenerateCVRequestBody = await request.json();
    
    // Redirigir la solicitud al backend que tiene acceso a la base de datos
    // y puede obtener el prompt activo directamente
    const backendResponse = await fetch(`${API_URL}/api/cv/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await backendResponse.json();
    
    if (!backendResponse.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: data.error || 'Error generando CV' 
        },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data);
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
