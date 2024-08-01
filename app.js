const express = require('express');
const app = express();
app.use(express.json());

const { BlobServiceClient } = require('@azure/storage-blob');
require("dotenv").config();

app.get('/', (req, res) => {
  res.status(200).send('Welcome!');
});

app.get('/api/:sa/:container/:blob', async (req, res, next) => {
  try {
    var blobServiceClient

    var AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!AZURE_STORAGE_CONNECTION_STRING) {
      const { DefaultAzureCredential } = require('@azure/identity');
      const accountName = req.params.sa
      
      blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        new DefaultAzureCredential()
      );
    } else {
      AZURE_STORAGE_CONNECTION_STRING = AZURE_STORAGE_CONNECTION_STRING.replace(/[']/g, '')
      blobServiceClient = BlobServiceClient.fromConnectionString(
        AZURE_STORAGE_CONNECTION_STRING
      );
    }

    // Get a reference to a container
    const containerName = req.params.container
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Get a block blob client
    const blobName = req.params.blob
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    console.log('\nListing blobs...');

    // List the blob(s) in the container.
    for await (const blob of containerClient.listBlobsFlat()) {
      // Get Blob Client from name, to get the URL
      const tempBlockBlobClient = containerClient.getBlockBlobClient(blob.name);

      // Display blob name and URL
      console.log(
        `\n\tname: ${blob.name}\n\tURL: ${tempBlockBlobClient.url}\n`
      );
    }

    const downloadBlockBlobResponse = await blockBlobClient.download(0);
    console.log('\nDownloaded blob content...');
    // console.log(
    //   '\t',
    //   await streamToText(downloadBlockBlobResponse.readableStreamBody)
    // );

    var blob = await streamToText(downloadBlockBlobResponse.readableStreamBody)
    res.setHeader('content-type', 'application/json');
    res.status(200).send(blob);

  } catch (err) {
    next(err)
  }

});

async function streamToText(readable) {
  readable.setEncoding('utf8');
  let data = '';
  for await (const chunk of readable) {
    data += chunk;
  }
  return data;
}

app.listen(8080, () => console.log(`Listening on port 8080..`));
