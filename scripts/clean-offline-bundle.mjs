#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

async function cleanDist() {
  const distPath = path.join(root, 'dist');
  
  try {
    await fs.access(distPath);
  } catch {
    console.log('[clean-offline-bundle] Pasta dist/ não encontrada. Nada a limpar.');
    return;
  }

  // 1. Deletar a pasta offline-bundle
  const offlineBundlePath = path.join(distPath, 'offline-bundle');
  try {
    await fs.rm(offlineBundlePath, { recursive: true, force: true });
    console.log('[clean-offline-bundle] ✅ Pasta dist/offline-bundle removida com sucesso.');
  } catch (err) {
    console.warn('[clean-offline-bundle] ⚠️ Não foi possível remover offline-bundle:', err.message);
  }

  // 2. Apagar todos os .gz e .br de dist/
  async function removeCompressedFiles(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await removeCompressedFiles(fullPath);
      } else if (entry.name.endsWith('.gz') || entry.name.endsWith('.br')) {
        await fs.unlink(fullPath);
      }
    }
  }

  try {
    await removeCompressedFiles(distPath);
    console.log('[clean-offline-bundle] ✅ Arquivos .gz e .br removidos de dist/ com sucesso.');
  } catch (err) {
    console.warn('[clean-offline-bundle] ⚠️ Erro ao remover arquivos comprimidos:', err.message);
  }
}

cleanDist();
