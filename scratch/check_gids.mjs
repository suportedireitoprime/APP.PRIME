import fs from 'fs';

async function checkGids() {
  const gids = [
    '165784632', '1890035872', '682493921', '1126134905', '578137110'
  ];
  
  for (const gid of gids) {
    const url = `https://docs.google.com/spreadsheets/d/1o2wPWhSHjAWZGJ3ZF5T1EOHVfHyB1B7K/export?format=csv&gid=${gid}`;
    const response = await fetch(url);
    const text = await response.text();
    console.log(`\n--- GID ${gid} ---`);
    console.log(text.substring(0, 300));
  }
}

checkGids().catch(console.error);
