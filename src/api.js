const cloudscraper = require('cloudscraper');
const {BASE_URL, MOVIES, SERIES, GENRES, BASE_URL_EXTENSION} = require('./util/urls')

const getMovies = async (type, page = '') => {
  const query = type === 0 ? '.json' : '.json';
  const res = await cloudscraper(`${BASE_URL}${MOVIES[type]}${query}`, { method: 'GET' });

  const body = res.pageProps;
  const movies = type >= 1 ? body.movies : body.tabLastMovies; //El type 1 y 5, requiere usar a page.
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

const getSeries = async(type) =>{
  const res = await cloudscraper(`${BASE_URL}serie`, {method: 'GET'});
  const body = await res;
  const $ = cheerio.load(body);
  const promises = [];

  $(`${SERIES[type]} > ul > li`).each((index , element) =>{
    if (type < 4){
      const $element = $(element);
      const id = $element.find('div.TPost.C > a').attr('href').split(BASE_URL_EXTENSION)[1];
      const title = $element.find('div.TPost.C > a > h2').text();
      const poster = $element.find('div.TPost.C > a > div > figure > img').attr('data-src');
      const year = $element.find('div.TPost.C > a > div > span.Year').text();
      const sypnosis = $element.find('div.TPMvCn > div.Description > p:nth-child(2)').text();
      const rating = $element.find('div.TPMvCn > p.Info > span.Vote').text();
      const duration = $element.find('div.TPMvCn > p.Info > span.Time').text();
      const director = $element.find('div.TPMvCn > div.Description > p.Director').text().replace('Director: ','').split(', ');
      const genres = $element.find('div.TPMvCn > div.Description > p.Genre').text().replace('Género: ','').split(', ');
      const cast = $element.find('div.TPMvCn > div.Description > p.Actors').text().replace('Actores: ','').split(', ');
      
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
      });
    }else{
      const $element = $(element);
      const id = $element.find('article.TPost.C > a').attr('href').split('.legal/')[1];
      const episode = $element.find('article.TPost.C > a > h2.Title').text();
      const poster = 'https://'+$element.find('article.TPost.C > a > div.Image > figure > img').attr('data-src').split('//')[1];
      
      promises.push({
        id: id || null,
        episode: episode || null,
        poster: poster ? `${BASE_URL}${poster}` : null
      });
    }
  })
  return await Promise.all(promises);
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
  const res = await cloudscraper(`${BASE_URL}category/${GENRES[type]}/page/${page}` , {method: 'GET'});
  const body = await res;
  const $ = cheerio.load(body);
  const promises = [];

  $(`#aa-wp > div.bd > div.TpRwCont.cont-page > main > ul > li`).each((index , element) =>{
    const $element = $(element);
    const id = $element.find('div.TPost.C > a').attr('href').split(BASE_URL_EXTENSION)[1];
    const title = $element.find('div.TPost.C > a > h2').text();
    const poster = $element.find('div.TPost.C > a > div > figure > img').attr('data-src');
    const year = $element.find('div.TPost.C > a > div > span.Year').text();
    const sypnosis = $element.find('div.TPMvCn > div.Description > p:nth-child(2)').text();
    const rating = $element.find('div.TPMvCn > p.Info > span.Vote').text();
    const duration = $element.find('div.TPMvCn > p.Info > span.Time').text();
    const director = $element.find('div.TPMvCn > div.Description > p.Director').text().replace('Director: ','').split(', ');
    const genres = $element.find('div.TPMvCn > div.Description > p.Genre').text().replace('Género: ','').split(', ');
    const cast = $element.find('div.TPMvCn > div.Description > p.Actors').text().replace('Actores: ','').split(', ');
    
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

const getByActor = async(id, page) => {
  const res = await cloudscraper(`${BASE_URL}actor/${id}/page/${page}` , {method: 'GET'});
  const body = await res;
  const $ = cheerio.load(body);
  const promises = [];

  $(`#aa-wp > div > div.TpRwCont.cont > main > ul > li`).each((index , element) =>{
    const $element = $(element);
    const id = $element.find('div.TPost.C > a').attr('href').split(BASE_URL_EXTENSION)[1];
    const title = $element.find('div.TPost.C > a > h2').text();
    const poster = $element.find('div.TPost.C > a > div > figure > img').attr('data-src');
    const year = $element.find('div.TPost.C > a > div > span.Year').text();
    const sypnosis = $element.find('div.TPMvCn > div.Description > p:nth-child(2)').text();
    const rating = $element.find('div.TPMvCn > p.Info > span.Vote').text();
    const duration = $element.find('div.TPMvCn > p.Info > span.Time').text();
    const director = $element.find('div.TPMvCn > div.Description > p.Director').text().replace('Director: ','').split(', ');
    const genres = $element.find('div.TPMvCn > div.Description > p.Genre').text().replace('Género: ','').split(', ');
    const cast = $element.find('div.TPMvCn > div.Description > p.Actors').text().replace('Actores: ','').split(', ');
    
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

const getSearch = async(query, page) => {
  const res = await cloudscraper(`${BASE_URL}page/${page}?s=${query.replace(/ /g,'+')}` , {method: 'GET'});
  const body = await res;
  const $ = cheerio.load(body);
  const promises = [];

  $(`#aa-wp > div.bd > div.TpRwCont.cont-page > main > ul > li`).each((index , element) =>{
    const $element = $(element);
    const id = $element.find('div.TPost.C > a').attr('href').split(BASE_URL_EXTENSION)[1];
    const title = $element.find('div.TPost.C > a > h2').text();
    const poster = $element.find('div.TPost.C > a > div > figure > img').attr('data-src');
    const year = $element.find('div.TPost.C > a > div > span.Year').text();
    const sypnosis = $element.find('div.TPMvCn > div.Description > p:nth-child(2)').text();
    const rating = $element.find('div.TPMvCn > p.Info > span.Vote').text();
    const duration = $element.find('div.TPMvCn > p.Info > span.Time').text();
    const director = $element.find('div.TPMvCn > div.Description > p.Director').text().replace('Director: ','').split(', ');
    const genres = $element.find('div.TPMvCn > div.Description > p.Genre').text().replace('Género: ','').split(', ');
    const cast = $element.find('div.TPMvCn > div.Description > p.Actors').text().replace('Actores: ','').split(', ');
    
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

const getLinks = async(id) => {
  const res = await cloudscraper(`${BASE_URL}${id}` , {method: 'GET'});
  const body = await res;
  const $ = cheerio.load(body);
  const promises = [];

  const latino = [];
  for(let i = 1; i < 11; i++){
    const url = $(`#OptL${i} > iframe`).attr('data-src');
    if(url !== undefined) {
      latino.push({
        url: 'https:' + url,
      })
    }
  }
  const espanol = [];
  for(let i = 1; i < 11; i++){
    const url = $(`#OptE${i} > iframe`).attr('data-src');
    if(url !== undefined) {
      espanol.push({
        url: 'https:' + url,
      })
    }
  }
  const sub = [];
  for(let i = 1; i < 11; i++){
    const url = $(`#OptS${i} > iframe`).attr('data-src');
    if(url !== undefined) {
      sub.push({
        url: 'https:' + url,
      })
    }
  }

  promises.push({
    latino: latino,
    espanol: espanol,
    sub: sub,
  });

  return await Promise.all(promises);
}

const getDownload = async(id, episode=null) => {
  const url = episode ? `${BASE_URL}${id}/${episode}` : `${BASE_URL}${id}`;
  const res = await cloudscraper(url , {method: 'GET'});
  const body = await res;
  const $ = cheerio.load(body);
  const promises = [];

  $(`#mdl-downloads > div.mdl-cn > div.mdl-bd > div > table > tbody > tr`).each((index , element) =>{
    const $element = $(element);
    const server = $element.find('td:nth-child(1)').text().split(' ')[1];
    const language = $element.find('td:nth-child(2)').text();
    const quality = $element.find('td:nth-child(3)').text();
    const link = $element.find('td:nth-child(4) a').attr('href');
    
    promises.push({
      server: server || null,
      language: language || null,
      quality: quality || null,
      link: link.includes('https:') ? link : 'https:' + link
    })
  })

  return await Promise.all(promises);
}

const getTrailer = async(id) => {
  const res = await cloudscraper(`${BASE_URL}${id}` , {method: 'GET'});
  const body = await res;
  const $ = cheerio.load(body);
  const promises = [];

  const url = $(`#OptY > iframe`).attr('data-src');

  promises.push({
    url: url || null,
  });

  return await Promise.all(promises);
}

module.exports = {
  getMovies,
  getSeries,
  getDetail,
  getByGenre,
  getByActor,
  getSearch,
  getLinks,
  getDownload,
  getTrailer
};
