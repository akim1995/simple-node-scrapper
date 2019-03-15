const fs = require('fs'); //access file system
const axios = require('axios'); //ajax library
const {JSDOM: jsdom} = require('jsdom');  // to generate dom access dom elements (https://github.com/cheeriojs/cheerio an alternative with jquery like syntax)
const sleep = require('system-sleep'); // sleep between requests
let errorNum = 0;
let resultFile = '';


//reading scv`
let data = fs.readFileSync('data.scv', 'utf8').split("\n");
data.pop();
//filtering our data
data = data.filter(link => /^http:\/\/www.ju-ris.ru\/blog/.test(link));

// it's not a bad idea to practice on some manually pasted links

// let data2 = [
// "http://www.ju-ris.ru/blog/2014/11/17/deputaty-gosdumy-predlagayut-strakhovat-dengi-na-schetakh-v-bankakh-malogo-i-srednego-biznesa/",
// "http://www.ju-ris.ru/blog/2012/12/05/rassmotreno-grazhdanskoe-delo-po-isku-prokurora-ob-osvobozhdenii-zemelnogo-uchastka-ot-stroitelnogo-musora/",
// "http://www.ju-ris.ru/blog/2012/01/27/yuristy-otstoyali-interesy-sobstvennika-zemelnogo-uchastka-po-ch-1-st-19-5-koap-rf/",
// "http://www.ju-ris.ru/blog/2009/05/21/лишение-родительских-прав/"
// ];

// looping through and making request
data.forEach((link, index) => {
		console.log(data.length, index+1, link);

	axios.get(encodeURI(data[index]))
		.then(response => {
			makeData(response.data, link);
			if(index === data.length-1) {
				console.log('generating php file...', index, data.length-1);
				// console.log(JSON.stringify(resultFile, null, '\t'));
				writeData();
				console.log('Complete.');
			}
		})
		.catch(err => {
			console.log('Cannot get file probably received 404 error');
		})

		sleep(.2*1000); // sleep for 10 seconds
})


function writeData(){
	let phpProlog = `<?php $solncevData = array (
	`;

	let phpEpilog = `

	);`;

	resultFile = phpProlog + resultFile + phpEpilog;
	fs.writeFileSync('result.php', resultFile);
}

//you need to change this part for each new projects
function makeData(data, link) {
	let dom = new jsdom(data);
	let title = dom.window.document.querySelector('header > .entry-title');
	title = title ? title.textContent : String(errorNum++);
	let date = dom.window.document.querySelector('.entry-date');
	date = date ? date.getAttribute('datetime') : '';
	let content = dom.window.document.querySelector('.entry-content');
	content = content ? content.innerHTML : 'Nothing';
	let previewPicture = dom.window.document.querySelector('.entry-content img:first-child');
	if(previewPicture) {
		if(previewPicture.getAttribute('width') >= 400) {
			previewPicture = previewPicture.src;
		} else {
			previewPicture = '';
		}
	} else {
		previewPicture = '';
	}
	previewPicture = previewPicture.replace(/http:\/\/www.ju-ris.ru\/blog\/wp-content\/uploads\//g, '/upload/blog/');

	if(title.length == 0) {
		title = String(errorNum++);
	}

	content = content.replace(/<script.*>.*<\/script>/g,'');
	content = content.replace(/http:\/\/www.ju-ris.ru\/blog\/wp-content\/uploads\//g, "/upload/blog/");
		
	content = content.replace(/"/g,'\\"');

	content = content.replace('\\{1}[^\\a-zA-Zа-яА-Я]', '\\\\')

	title = title.replace(/"/g,'\\"');
	let pageData = {
		title,
		content,
		link
	};

	if(content !== 'Nothing') {
		resultFile += `
			array(
				"title" => "${title}",
				"content" => "${content}",
				"link" => "${link}",
				"preview" =>  "${previewPicture}",
				"date" =>  "${date}"
			),
		`;
	}
};

