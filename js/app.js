const floatingButton = document.getElementById("floating-button");
const currentPage = document.body.dataset.page;

floatingButton.addEventListener("click", () => {
  if (currentPage === "index") {
    console.log("IN DEV | create wishlist");
  } else {
    console.log("IN DEV | other page actions");
  }
});
