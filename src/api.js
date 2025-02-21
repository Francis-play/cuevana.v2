const cloudscraper = require('cloudscraper');
const {BASE_URL, MOVIES, SERIES, GENRES} = require('./utils/urls')

const getMovies = async (type, page = '') => {
  const query = type === 0 ? '.json' : '.json';
  const res = await cloudscraper(`${BASE_URL}${MOVIES[type]}${query}`, { method: 'GET' });

  const body = typeof res === 'string' ? JSON.parse(res).pageProps : res.pageProps;

  const movies = type >= 1 
    ? (body.tabLastMovies || body.movies)  // Si tabLastMovies existe, se usa. Si no, se usa movies.
    : body.movies; //El type 1 y 5, requiere usar a page.

  const promises = movies.map((movie) => {
    const id = movie.TMDbId;
    const title = movie.titles.name;
    const poster = movie.images.poster;
    const year = new Date(movie.releaseDate).getFullYear();
    const synopsis = movie.overview;
    const rating = movie.rate.average;
    const duration = null;
    const director = null;
    const genres = movie.genres.map((genre) => genre.name).join(', ');
    const cast = movie.cast.acting.map(actor => actor.name).join(', ');

    return {
      id: id || null,
      title: title || null,
      poster: poster ? `${BASE_URL}${poster}` : null,
      year: year || null,
      synopsis: synopsis || null,
      rating: rating || null,
      duration: duration || null,
      director: director || null,
      genres: genres || null,
      cast: cast || null
    };
  });

  return Promise.all(promises);
};

const getSeries = async (type, page = '') => {
  const query = type === 0 ? '.json' : '.json';
  const res = await cloudscraper(`${BASE_URL}${SERIES[type]}${query}`, { method: 'GET' });

  const body = typeof res === 'string' ? JSON.parse(res) : res;

  const series = body.pageProps.movies; //El type 1 y 3, requiere usar a page.

  const promises = series.map((serie) => {
    const id = serie.TMDbId;
    const title = serie.titles.name;
    const poster = serie.images.poster;
    const year = new Date(serie.releaseDate).getFullYear();
    const synopsis = serie.overview;
    const rating = serie.rate.average;
    const duration = null;
    const director = null;
    const genres = serie.genres.map((genre) => genre.name).join(', ');
    const cast = serie.cast.acting.map(actor => actor.name).join(', ');

    return {
      id: id || null,
      title: title || null,
      poster: poster ? `${BASE_URL}${poster}` : null,
      year: year || null,
      synopsis: synopsis || null,
      rating: rating || null,
      duration: duration || null,
      director: director || null,
      genres: genres || null,
      cast: cast || null
    };
  });

  return Promise.all(promises);
};

const getDetail = async(id, episode=null) => {
  const url = episode ? `${BASE_URL}${id}/${episode}` : `${BASE_URL}${id}`;
  const res = await cloudscraper(url , {method: 'GET'});
  const body = await res;
  const $ = cheerio.load(body);
  const promises = [];

  const poster = $('#aa-wp > div.bd > div.backdrop > article > div.Image > figure > img').attr('data-src').replace('w185_and_h278','w600_and_h900');
  const background = $('#aa-wp > div.bd > div.backdrop > div > figure > img').attr('data-src');
  const title = $('#aa-wp > div.bd > div.backdrop > article > header > h1').text();
  const original_title = $('#aa-wp > div.bd > div.backdrop > article > header > h2').text();
  const sypnosis= $('#aa-wp > div.bd > div.backdrop > article > div.Description > p').text();
  const year = $('#aa-wp > div.bd > div.backdrop > article > footer > p > span:nth-child(2) > a').text();
  const duration = $('#aa-wp > div.bd > div.backdrop > article > footer > p > span:nth-child(1)').text();
  const rating = $('#post-ratings-5556 > strong:nth-child(3)').text();
  const director = $('#MvTb-Info > ul > li:nth-child(1) > span').text().split(', ');
  const genres = [];
  $(`#MvTb-Info > ul > li:nth-child(2) > a`).each((index , element) =>{
    const $element = $(element);
    const id = $element.attr('href').split('/')[4];
    const genre = $element.text();

    genres.push({
      id: id || null,
      genre: genre || null,
    })
  })
  const cast = [];
  $(`#MvTb-Info > ul > li.AAIco-adjust > a`).each((index , element) =>{
    const $element = $(element);
    const id = $element.attr('href').split('/')[4];
    const name = $element.text().replace(',','');

    cast.push({
      id: id || null,
      name: name || null,
    })
  })
 
  if (id.includes('serie')){
    const episodes = [];
    for(let i = 1; i < 30; i++){
      const season = [];
      $(`#season-${i} > li`).each((index , element) =>{
        const $element = $(element);
        const id = $element.find('article a').attr('href').split('.legal/')[1];
        const episode = $element.find('article a div.Image span.Year').text().split('x')[1];
        const preview = $element.find('article a div.Image figure img').attr('data-src').replace('w185','w500');
        const release = $element.find('article a p').text();
        
        season.push({
          id: id || null,
          episode: episode || null,
          preview: preview.includes('https:') ? preview : 'https:' + preview || null,
          release: release || null
        })
      })
      if(season.length === 0) { break }
      episodes.push({
        season: i,
        episodes: season,
      });
    }

    promises.push({
      id: id,
      poster: poster ? `${BASE_URL}${poster}` : null,
      background: background || null,
      title: title || null,
      original_title: original_title || null,
      sypnosis: sypnosis || null,
      year: year || null,
      duration: duration || null,
      rating: rating || null,
      director: director || null,
      genres: genres || null,
      cast: cast || null,
      episodes: episodes
    })
  } else {
    const latino = [];
    for(let i = 1; i < 11; i++){
      const url = $(`#OptL${i} > iframe`).attr('data-src');
      if(url === undefined) {break}
      latino.push({
        url: 'https:' + url,
      })
    }
    const espanol = [];
    for(let i = 1; i < 11; i++){
      const url = $(`#OptE${i} > iframe`).attr('data-src');
      if(url === undefined) {break}
      espanol.push({
        url: 'https:' + url,
      })
    }
    const sub = [];
    for(let i = 1; i < 11; i++){
      const url = $(`#OptS${i} > iframe`).attr('data-src');
      if(url === undefined) {break}
      sub.push({
        url: 'https:' + url,
      })
    }

    promises.push({
      id: id,
      poster: poster ? `${BASE_URL}${poster}` : null,
      background: background || null,
      title: title || null,
      original_title: original_title || null,
      sypnosis: sypnosis || null,
      year: year || null,
      duration: duration || null,
      rating: rating || null,
      director: director || null,
      genres: genres || null,
      cast: cast || null,
      links:{
        latino: latino,
        espanol: espanol,
        sub: sub,
      }
    })
  }

  return await Promise.all(promises);
}

const getByGenre = async(type, page) => {
  const url = page
    ? `${BASE_URL}genero/${GENRES[type]}/page/${page}.json`
    : `${BASE_URL}genero/${GENRES[type]}.json`;

  const res = await cloudscraper(url, { method: 'GET' });

  const body = typeof res === 'string' ? JSON.parse(res).pageProps : res.pageProps;

  const movies = type >= 1 
    ? (body.tabLastMovies || body.movies)
    : body.movies;

  const promises = movies.map((movie) => {
    const id = movie.TMDbId;
    const title = movie.titles.name;
    const poster = movie.images.poster;
    const year = new Date(movie.releaseDate).getFullYear();
    const synopsis = movie.overview;
    const rating = movie.rate.average;
    const duration = null;
    const director = null;
    const genres = movie.genres.map((genre) => genre.name).join(', ');
    const cast = movie.cast.acting.map(actor => actor.name).join(', ');
    
    promises.push({
      id: id || null,
      title: title || null,
      poster: poster ? `${BASE_URL}${poster}` : null,
      year: year || null,
      sypnosis: sypnosis || null,
      rating: rating || null,
      duration: duration || null,
      director: director || null,
      genres: genres || null,
      cast: cast || null
    })
  })
  return await Promise.all(promises);
}



const getSearch = async(query) => {
  const res = await cloudscraper(`${BASE_URL}search.json?q=${query.replace(/ /g,'+')}` , {method: 'GET'});
  const body = typeof res === 'string' ? JSON.parse(res).pageProps : res.pageProps;

  const movies = type >= 1 
    ? (body.tabLastMovies || body.movies)
    : body.movies;

  const promises = movies.map((movie) => {
    const id = movie.TMDbId;
    const title = movie.titles.name;
    const poster = movie.images.poster;
    const synopsis = movie.overview;
    const url = movie.url.slug;
    
    promises.push({
      id: id || null,
      title: title || null,
      poster: poster ? `${BASE_URL}${poster}` : null,
      sypnosis: sypnosis || null,
      url: url || null
    })
  })
  return await Promise.all(promises);
}

const getLinks = async (slug, temp, episode) => {
  // Si hay un slug, significa que estamos buscando una serie o un episodio específico

  const res = temp 
    ? await cloudscraper(`${BASE_URL}${slug}/temporada/${temp}/episodio/${episode}.json`, { method: 'GET' }) 
    : await cloudscraper(`${BASE_URL}${slug}.json`, { method: 'GET' });

  const body = typeof res === 'string' ? JSON.parse(res).pageProps : res.pageProps;

  // Usamos 'content' para manejar ambos casos (series o películas)
  const content = body.episode || body.thisMovie;

  if (!content) {
    console.error('No se encontró contenido');
    return [];
  }
  const contentArr = Array.isArray(content) ? content : [content];


  // Procesamos la información de la serie o película
  const contentPromises = contentArr.map((item) => {
    const id = item.TMDbId;
    const title = item.titles?.name || item.title || null;  // Aseguramos que podamos acceder al título
    const poster = item.images?.poster || null;
    const synopsis = item.overview || null;
    const year = item.releaseDate ? new Date(item.releaseDate).getFullYear() : null;
    const rating = item.rate?.average || null;
    const duration = item.runtime || null;
    const director = item.cast?.directing?.map((director) => director.name).join(', ') || null;
    const genres = item.genres?.map((genre) => genre.name).join(', ') || '';
    const cast = item.cast?.acting?.map((actor) => actor.name).join(', ') || '';
    //const AllVideos = item.videos?.latino?.map(cyberlocker => cyberlocker.result) || [];

    const allVideos = [];
    const languages = ['latino', 'spanish', 'english', 'japanese'];

    languages.forEach((language) => {
      if (item.videos?.[language] && item.videos[language].length > 0) {
        const videoLinks = item.videos[language].map((cyberlocker) => ({
          cyberlocker: cyberlocker.cyberlocker,
          result: cyberlocker.result,
          quality: cyberlocker.quality || 'HD', // Aseguramos que siempre haya calidad
        }));

        allVideos.push({
          language: language,
          videos: videoLinks,
        });
      }
    });

    return {
      id: id || null,
      title: title || null,
      poster: poster,
      year: year || null,
      synopsis: synopsis || null,
      rating: rating || null,
      duration: duration || null,
      director: director || null,
      genres: genres || '',
      cast: cast || '',
      videos: allVideos.length > 0 ? allVideos : null,
    };
  });

  // Devolvemos todas las promesas
  return await Promise.all(contentPromises);
};


const getDownload = async(slug, temp, episode) => {
  const res = temp 
    ? await cloudscraper(`${BASE_URL}${slug}/temporada/${temp}/episodio/${episode}.json`, { method: 'GET' }) 
    : await cloudscraper(`${BASE_URL}${slug}.json`, { method: 'GET' });

  const body = typeof res === 'string' ? JSON.parse(res).pageProps : res.pageProps;

  // Usamos 'content' para manejar ambos casos (series o películas)
  const content = body.episode || body.thisMovie;

  const promises = [];

  const contentPromises = content.downloads.map((item) => {

    const server = item.cyberlocker || null;
    const language = item.language || null;
    const quality = item.quality || null;
    const link = item.result || '';
    
    promises.push({
      server: server || null,
      language: language || null,
      quality: quality || null,
      link: link.includes('https:') ? link : 'https:' + link
    })
  })

  return await Promise.all(promises);
}


module.exports = {
  getMovies,
  getSeries,
  getDetail,
  getByGenre,
  getSearch,
  getLinks,
  getDownload,
};
