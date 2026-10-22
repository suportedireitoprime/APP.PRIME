const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const fs = require('fs');

const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '199f43b3ef1e89db1506e45430cb4660',
    secretAccessKey: '6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc'
  }
});

async function getR2FolderStats() {
  console.log('=== VERIFICANDO CONTEÚDO EXATO DE CADA ÁREA NO R2 (vacatio-midias) ===');
  const areas = [
    'direito-administrativo',
    'direito-ambiental',
    'direito-civil',
    'direito-constitucional',
    'direito-desportivo',
    'direito-do-trabalho',
    'direito-empresarial',
    'direito-financeiro',
    'direito-internacional-privado',
    'direito-penal',
    'direito-previdenciario',
    'direito-processual-civil',
    'direito-processual-do-trabalho',
    'direito-processual-penal',
    'direito-tributario',
    'direito-urbanistico',
    'direitos-humanos',
    'filosofia-do-direito',
    'formacao-complementar',
    'lei-penal-especial',
    'politicas-publicas',
    'portugues'
  ];

  const stats = {};

  for (const area of areas) {
    let token = undefined;
    let mp3Count = 0;
    let keepCount = 0;
    let otherCount = 0;
    let sample = [];

    do {
      const res = await s3.send(new ListObjectsV2Command({
        Bucket: 'vacatio-midias',
        Prefix: `narracoes/areas/${area}/`,
        ContinuationToken: token,
        MaxKeys: 1000
      }));

      if (res.Contents) {
        for (const item of res.Contents) {
          if (item.Key.endsWith('.mp3')) {
            mp3Count++;
            if (sample.length < 3) sample.push(item.Key);
          } else if (item.Key.endsWith('.keep')) {
            keepCount++;
          } else {
            otherCount++;
          }
        }
      }
      token = res.NextContinuationToken;
    } while (token);

    stats[area] = { mp3Count, keepCount, otherCount, sample };
    console.log(`- ${area}: ${mp3Count} mp3s (keep: ${keepCount})`);
  }

  return stats;
}

async function analyzeDriveFolders() {
  console.log('\n=== ANALISANDO PASTAS DO DRIVE ===');
  const data = JSON.parse(fs.readFileSync('scripts/drive_r2_analysis.json', 'utf8'));
  const allFolders = data.driveInfo.allFolders;

  console.log('Todas as pastas do Drive:');
  allFolders.forEach((f, idx) => {
    console.log(`${idx + 1}. [${f.name}]`);
  });

  return allFolders;
}

async function main() {
  const driveFolders = await analyzeDriveFolders();
  const r2Stats = await getR2FolderStats();

  fs.writeFileSync('scripts/detailed_verification_result.json', JSON.stringify({ driveFolders, r2Stats }, null, 2));
}

main().catch(console.error);
