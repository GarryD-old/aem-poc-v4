export default function decorate(block) {
  // Authored as a single-column table, one row each:
  //   1) headshot image  2) name (optionally a link)  3) profession  4) description
  const rows = [...block.children].map((row) => row.querySelector(':scope > div') || row);
  const [imageCell, nameCell, professionCell, descCell] = rows;

  block.textContent = '';

  const media = document.createElement('div');
  media.className = 'author-bio-media';
  const pic = imageCell?.querySelector('picture, img');
  if (pic) media.append(pic.closest('picture') || pic);

  const info = document.createElement('div');
  info.className = 'author-bio-info';

  const name = document.createElement('div');
  name.className = 'author-bio-name';
  if (nameCell) name.append(...nameCell.childNodes);

  const profession = document.createElement('div');
  profession.className = 'author-bio-profession';
  if (professionCell) profession.append(...professionCell.childNodes);

  info.append(name, profession);

  const header = document.createElement('div');
  header.className = 'author-bio-header';
  header.append(media, info);

  const description = document.createElement('div');
  description.className = 'author-bio-description';
  if (descCell) description.append(...descCell.childNodes);

  block.append(header, description);
}
