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
        filter: {
          property: "Estado",
          status: {
            equals: "Activo"
          }
        },
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

    const services = response.data.results.map(page => {
      // Extraer todas las propiedades relevantes con manejo de casos donde los arrays estén vacíos
      const titleProperty = page.properties["Nombre del Servicio"].title;
      const title = titleProperty && titleProperty.length > 0 ? titleProperty[0].plain_text : 'Título Desconocido';

      const descriptionProperty = page.properties.Descripción.rich_text;
      const description = descriptionProperty && descriptionProperty.length > 0 ? descriptionProperty[0].plain_text : 'Descripción Desconocida';

      const category = page.properties.Categoría.select ? page.properties.Categoría.select.name : 'Unknown';
      const duration = page.properties.Duración && page.properties.Duración.rich_text && page.properties.Duración.rich_text.length > 0 ? page.properties.Duración.rich_text[0].plain_text : 'N/A';

      // Extraer el responsable
      const responsibleProperty = page.properties.Responsable.people;
      let responsible = 'Unknown';
      if (responsibleProperty && responsibleProperty.length > 0) {
        const firstPerson = responsibleProperty[0];
        if (firstPerson.person && firstPerson.person.email) {
          responsible = firstPerson.person.email;
        } else if (firstPerson.name) { // Fallback to name if email not available or bot
          responsible = firstPerson.name;
        }
      }

      // Aplicar segmentación de categoría (MASAJE -> Cuidados)
      let mappedCategory = category;
      if (category === 'MASAJE') {
        mappedCategory = 'Cuidados';
      }

      return {
        title: title,
        description: description,
        category: mappedCategory,
        responsible: responsible,
        // Si en el futuro necesitas la categoría o la duración en la respuesta de la API,
        // solo tendrías que descomentar estas líneas:
        // duration: duration,
      };
    });

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
