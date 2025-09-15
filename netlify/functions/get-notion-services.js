const axios = require('axios');

exports.handler = async (event, context) => {
  try {
    const databaseId = process.env.NOTION_DATABASE_ID;
    const notionApiToken = process.env.NOTION_API_TOKEN;

    if (!notionApiToken || !databaseId) {
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "https://anamcara-wellness.es",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: "Notion API token or Database ID not set." }),
      };
    }

    const response = await axios.post(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        sorts: [
          {
            property: "Nombre del Servicio",
            direction: "ascending",
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${notionApiToken}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
      }
    );

    const services = response.data.results.map(page => ({
      title: page.properties["Nombre del Servicio"].title[0].plain_text,
      description: page.properties.Descripción.rich_text[0].plain_text,
      // Añade más propiedades según la estructura de tu tabla de Notion
    }));

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://anamcara-wellness.es", // Asegúrate de cambiar esto a tu dominio real
        "Content-Type": "application/json",
      },
      body: JSON.stringify(services),
    };
  } catch (error) {
    console.error("Error fetching Notion data in serverless function:", error.message);
    return {
      statusCode: error.response ? error.response.status : 500,
      headers: {
        "Access-Control-Allow-Origin": "https://anamcara-wellness.es",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Failed to fetch services",
        details: error.message,
      }),
    };
  }
};
