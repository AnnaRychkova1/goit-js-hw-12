import buttonService from "./js/servises/buttonService.js";
import isiToast from './js/servises/isiToast.js';
import { showLoader, hideLoader } from "./js/servises/loaderService.js"
import { refs } from './js/templates/refs.js';
import createItemsMarkup from './js/templates/createItemsMarkup.js';
import { searchImageByName } from './js/servises/imgApi.js';
import { onLightBox } from "./js/servises/lightBox.js";

const queryParams = {
  query: '',
  page: 1,
  maxPage: 0,
  per_page: 30,
};

const { query } = refs.searchForm.elements;
query.addEventListener('mouseenter', onMouseOver);

function onMouseOver() {
  refs.searchForm.addEventListener('submit', handleSearch);
  buttonService.enableBtn(refs.searchBtn);
}

refs.searchForm.addEventListener('submit', handleSearch);
hideLoader(refs.loaderModal);

async function handleSearch(event) {
  buttonService.disableBtn(refs.searchBtn);
  showLoader(refs.loaderModal);
  event.preventDefault();

  refs.resultContainer.innerHTML = '';
  
  queryParams.page = 1;

  const formQuery = event.currentTarget;
  queryParams.query = formQuery.elements.query.value.trim();

  if (!queryParams.query) {
    isiToast.noQuery();
    hideLoader(refs.loaderModal);
    return;
  }

  try {
    const { hits, totalHits } = await searchImageByName(queryParams);
    queryParams.maxPage = Math.ceil(totalHits / queryParams.per_page);

    if (!hits || totalHits === 0) {
      isiToast.noImg();
      return;
    }

    if (hits.length > 0 && hits.length !== totalHits) {
      refs.loadMoreBtn.addEventListener('click', handleLoadMore);
      buttonService.show(refs.loadMoreBtn);
      } else {
      buttonService.hide(refs.loadMoreBtn);
      buttonService.enableBtn(refs.searchBtn);
    }

    createItemsMarkup(hits, refs.resultContainer);
    onLightBox();
  } catch (error) {
    console.error('Error fetching images:', error);
    isiToast.apiError();
  } finally {
    hideLoader(refs.loaderModal);
    formQuery.reset();
  }
}

async function handleLoadMore() {
  showLoader(refs.loaderModal);
  
  buttonService.disable(refs.loadMoreBtn, refs.preloader);
  queryParams.page += 1;

  try {
    const { hits } = await searchImageByName(queryParams);
    createItemsMarkup(hits, refs.resultContainer);

    onLightBox();

    const elementHeight = document.querySelector('.gallery-item').getBoundingClientRect().height;
    window.scrollBy({
      top: 1.7 * elementHeight,
      behavior: 'smooth',
    })

  } catch (error) {
    console.error('Error fetching images:', error);
    isiToast.apiError();
  } finally {
    hideLoader(refs.loaderModal);
    buttonService.enable(refs.loadMoreBtn, refs.preloader);

    if (queryParams.page === queryParams.maxPage) {
      buttonService.hide(refs.loadMoreBtn);
      refs.loadMoreBtn.removeEventListener('click', handleLoadMore);
      buttonService.enableBtn(refs.searchBtn);
      isiToast.endOfSearch();
    }
  }
}
