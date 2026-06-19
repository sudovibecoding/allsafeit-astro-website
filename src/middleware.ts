import { defineMiddleware } from 'astro/middleware';
import { isEditorRequest } from '@storyblok/astro';

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, locals } = context;

  if (request.method === 'POST') {
    const editorRequest = isEditorRequest(new URL(request.url));
    if (editorRequest) {
      try {
        const requestBody = await request.clone().json();
        if (requestBody?.story?.is_storyblok_preview) {
          locals._storyblok_preview_data = requestBody;
        }
      } catch (error) {
        console.error('Storyblok preview middleware:', error);
      }
    }
  }

  return next();
});
