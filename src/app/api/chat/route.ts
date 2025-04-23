import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

// Disable body parsing to handle form data manually
export const config = {
  api: {
    bodyParser: false,
  },
};

interface RequestData {
  message: string;
  hasAttachments?: boolean;
  fileCount?: number;
  fileNames?: string[];
}

interface FileInfo {
  name: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('API route called');
    
    // Check if we have an API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('No OpenAI API key found');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' }, 
        { status: 500 }
      );
    }
    
    // Determine if this is a multipart form request
    const contentType = request.headers.get('content-type') || '';
    console.log('Content-Type:', contentType);
    
    let message = '';
    let fileInfo: FileInfo[] = [];
    
    if (contentType.includes('multipart/form-data')) {
      try {
        // Create temp directory for uploads
        const uploadDir = path.join(os.tmpdir(), 'neurosci-ai-uploads');
        await mkdir(uploadDir, { recursive: true });
        
        // Handle form data with files using the formData() method
        const formData = await request.formData();
        
        // Get message text
        message = formData.get('message') as string || '';
        console.log('Message from form:', message);
        
        // Process files
        const files = formData.getAll('files');
        console.log(`Found ${files.length} files in form data`);
        
        // Save files and collect info
        for (const file of files) {
          if (file instanceof Blob) {
            const fileName = (file as any).name || `file-${uuidv4()}`;
            const fileType = file.type;
            const fileSize = file.size;
            
            // Generate a unique file path
            const filePath = path.join(uploadDir, `${uuidv4()}-${fileName}`);
            
            // Save the file
            const buffer = Buffer.from(await file.arrayBuffer());
            await writeFile(filePath, buffer);
            
            // Add to file info
            fileInfo.push({
              name: fileName,
            });
            
            console.log(`Saved file: ${fileName} (${fileSize} bytes)`);
          }
        }
      } catch (e) {
        console.error('Error processing form data:', e);
        return NextResponse.json(
          { error: 'Error processing uploaded files' },
          { status: 400 }
        );
      }
    } else {
      // Regular JSON request
      try {
        const data: RequestData = await request.json();
        message = data.message || '';
        
        if (data.hasAttachments) {
          console.log(`Request mentions ${data.fileCount} files, but they were not uploaded`);
          fileInfo = data.fileNames?.map((name: string): FileInfo => ({ name })) || [];
        }
      } catch (e) {
        console.error('Error parsing JSON:', e);
        return NextResponse.json(
          { error: 'Invalid JSON in request' },
          { status: 400 }
        );
      }
    }
    
    if (!message && fileInfo.length === 0) {
      return NextResponse.json(
        { error: 'Message or files are required' },
        { status: 400 }
      );
    }

    // Build prompt based on files and message
    let prompt = message;
    
    if (fileInfo.length > 0) {
      const fileDescription = fileInfo
        .map(file => `- ${file.name}`)
        .join('\n');
        
      prompt += `\n\nThe user has uploaded the following files:\n${fileDescription}\n\nPlease acknowledge these files.`;
    }

    // Call OpenAI API
    console.log('Calling OpenAI API...');
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are neurosci.ai, a specialized assistant for neuroscience and animal behavioral analysis.

When formatting your responses:
- Use clear paragraph breaks between distinct points or sections
- Add a blank line between paragraphs for better readability
- Use appropriate headings and subheadings when covering multiple topics
- Format lists with proper spacing
- Structure complex explanations with clear visual separation

You have knowledge of neuroscience research up to your training cutoff date.
When you don't know something or when asked about future events, acknowledge your limitations clearly.
When files are uploaded, acknowledge them but explain that you cannot directly analyze their contents.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI API error:", errorData);
      return NextResponse.json(
        { error: `Error from OpenAI: ${errorData.error?.message || 'Unknown error'}` }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Successfully got response from OpenAI');
    
    return NextResponse.json({
      response: data.choices[0].message.content,
      files: fileInfo.map(file => ({
        name: file.name,
  }
} 
  } catch (error) {
    console.error('Detailed error in chat API route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' }, 
      { status: 500 }
    );
  }
} 