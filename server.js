const express = require('express');
const os = require('os');
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const app = express();
const PORT = process.env.PORT || 3000;
const s3 = new S3Client({ region: 'ap-south-1' });
const BUCKET_NAME = 'myapp-assets-manas-7391';

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', hostname: os.hostname(), uptime: process.uptime() });
});

let items = [{ id: 1, name: 'Sample Item' }];

app.get('/api/items', (req, res) => res.json(items));

app.post('/api/items', (req, res) => {
  const item = { id: Date.now(), name: req.body.name };
  items.push(item);
  res.status(201).json(item);
});

app.get('/api/items/:id', (req, res) => {
  const item = items.find(i => i.id == req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

app.get('/s3-test', async (req, res) => {
  try {
    const content = `Test file created at ${new Date().toISOString()}`;
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `test-${Date.now()}.txt`,
      Body: content,
    });
    await s3.send(command);
    res.json({ status: 'success', message: 'File uploaded to S3!' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/s3-list', async (req, res) => {
  try {
    const command = new ListObjectsV2Command({ Bucket: BUCKET_NAME });
    const data = await s3.send(command);
    const files = (data.Contents || []).map(f => f.Key);
    res.json({ status: 'success', files });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.listen(PORT, () => console.log(`App running on port ${PORT}`));
