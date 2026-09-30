import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import AdminPush from './src/pages/AdminPush';

try {
  console.log("Rendering...");
  const html = renderToString(<StaticRouter location="/admin-push"><AdminPush /></StaticRouter>);
  console.log("Render successful!");
} catch (e: any) {
  console.error("RENDER ERROR:", e.message, e.stack);
}
