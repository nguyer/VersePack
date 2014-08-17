
function getCard(cardNumber, translation) {
	var deferred = Q.defer();

	$.ajax('./json/' + translation + '/' + cardNumber + '.json', {
		dataType  : 'json',
		isLocal   : true,
		success   : function (data) {
			var card = '<div class="card" id="' + cardNumber + '">\
				<div class="content">\
					<div class="translation">' + data.version + '</div>\
					<div class="topic">' + data.topic + '</div>\
					<div class="reference">' + data.reference + '</div>\
					<div>' + data.verse + '</div>\
					<div class="bottomReference">' + data.reference + '</div>\
					<div class="seriesNumber">'+ data.seriesLetter + '-'  + data.verseNumber + '</div>\
					<div class="seriesTitle">' + data.seriesTitle + '</div>\
				</div>\
			</div>';
			deferred.resolve($(card));
		},
			error : function () {
				window.alert("Error loading JSON. You're probably using a browser that doesn't support loading local files.");
			}
	});
	return deferred.promise;
}


function compareCards(thisOne, thatOne) {
	if (thisOne[0] < thatOne[0]) {
		return -1;
	}
	else if (thisOne[0] > thatOne[0]) {
		return 1;
	}
	else if (Number(thisOne.substring(1)) < Number(thatOne.substring(1))) {
		return -1;
	}
	else if (Number(thisOne.substring(1)) > Number(thatOne.substring(1))) {
		return 1;
	}
	return 0;
}

$(document).ready(function () {

    $.support.cors = true;

	var currentCardStack = JSON.parse(localStorage.getItem('currentCardStack')) || [ 'a1', 'a2', 'a3', 'a4' ];

	var currentTranslation = 'esv';
	var currentCardIndex = Number(localStorage.getItem('currentCardIndex')) || 0;

	var tutorialPassed = JSON.parse(localStorage.getItem('tutorialPassed')) || false;



	function setActiveCard(cardIndex) {
		var previousIndex = (cardIndex - 1 + currentCardStack.length) % currentCardStack.length;
		var nextIndex = (cardIndex + 1 + currentCardStack.length) % currentCardStack.length;
		var activeCard = $('.card:eq(' + cardIndex + ')');
		var previousCard =	$('.card:eq(' + previousIndex + ')');
		var nextCard = $('.card:eq(' + nextIndex + ')');
		$('.card').removeClass('active nextCard previousCard');
		activeCard.addClass('active');
		if (cardIndex !== previousIndex || cardIndex !== nextIndex) {
			nextCard.addClass('nextCard');
			previousCard.addClass('previousCard');
			localStorage.setItem('currentCardIndex', cardIndex);
		}
	}

	currentCardStack.reduce(function(previous, index) {
		return previous.then(function() {
			return getCard(index, currentTranslation).then(function(card) {
				$('.cardStack').append(card);
			});
		});
	}, Q.resolve()).then(function() {

		setActiveCard(currentCardIndex);

		if (!tutorialPassed) {
			$('body').append('<div class="tutorial"></div>');
			$('.tutorial').load('tutorial.html .step1', function () {
				$('.step1 > .nextButton').click(function () {
					$('.tutorial').load('tutorial.html .step2');

					$('.cardStack').one('swipeleft', step3).one('swiperight', step3);

					function step3() {
						$('.tutorial').load('tutorial.html .step3', function () {
							$('.cardStack').off('swipeleft', step3);
							$('.cardStack').off('swiperight', step3)
							$('.cardStack').one('swipeup', function () {
								$('.tutorial').load('tutorial.html .step4', function () {
									$('.wrap').one('click', function () {
										$('.tutorial').load('tutorial.html .step5', function () {
											$('.step5 > .nextButton').click(function () {
												$('.tutorial').remove();
												localStorage.setItem('tutorialPassed', true);
											});
										});
									});
								}).css('bottom', '').css('top', '');
							});
						}).css('bottom', 'auto').css('top', 0);
					}
				});
			});
		}

		var wrap = $('.cardStack');
		var width = wrap.width();

		$(window).resize(function() {
			width = wrap.width();
		});

		wrap
		.on('swipeup', function() {
			showMenu();
		})
		.on('swipeleft', function() {
			next();
		})

		.on('swiperight', function() {
			previous();
		})

		.on('movestart', function() {
			wrap.addClass('notransition');
		})

		.on('move', function(e) {
			var left = 100 * e.distX / width;
			var previousIndex = (currentCardIndex - 1 + currentCardStack.length) % currentCardStack.length;
			var nextIndex = (currentCardIndex + 1 + currentCardStack.length) % currentCardStack.length;
			var activeCard = $('.card:eq(' + currentCardIndex + ')');
			var previousCard =	$('.card:eq(' + previousIndex + ')');
			var nextCard = $('.card:eq(' + nextIndex + ')');

			if (Math.abs(e.distX) > Math.abs(e.distY)) {
				if (e.distX < 0) {
					activeCard.css('left', left + '%');
					nextCard.css('left', 100 + left + '%');
				}
				else if (e.distX > 0) {
					activeCard.css('left', left + '%');
					previousCard.css('left', left - 100 + '%');
				}
			}
		})

		.on('moveend', function() {
			wrap.removeClass('notransition');
			var previousIndex = (currentCardIndex - 1 + currentCardStack.length) % currentCardStack.length;
			var nextIndex = (currentCardIndex + 1 + currentCardStack.length) % currentCardStack.length;
			var activeCard = $('.card:eq(' + currentCardIndex + ')');
			var previousCard =	$('.card:eq(' + previousIndex + ')');
			var nextCard = $('.card:eq(' + nextIndex + ')');
			activeCard.css('left', '');
			nextCard.css('left', '');
			previousCard.css('left', '');
		});


		$(document).keydown(function(e){
			if (e.keyCode === 37) {
				previous();
			}
			else if (e.keyCode === 39) {
				next();
			}
			else if (e.keyCode === 38) {
				showMenu();
			}
			else if (e.keyCode === 40) {
				hideMenu();
			}
		});

		function next() {
			currentCardIndex = (currentCardIndex + 1 + currentCardStack.length) % currentCardStack.length;
			setActiveCard(currentCardIndex);
		}

		function previous() {
			currentCardIndex = (currentCardIndex - 1 + currentCardStack.length) % currentCardStack.length;
			setActiveCard(currentCardIndex);
		}

		function showMenu() {
			$('.menu').addClass('menuVisible');
		}

		function hideMenu() {
			$('.menu').removeClass('menuVisible');
		}

		$('.cardStack').click(function() {
			hideMenu();
		});

		for (var letterCode = 65; letterCode < 70; letterCode++) {
			var letter = String.fromCharCode(letterCode);
			var lowerCaseLetter = String.fromCharCode(letterCode + 32);
			var verseGroup = $('<p></p>');
			for (var number = 1; number < 13; number++) {
				var verseToggle =$('<div class="verseToggle" data-value="'+ lowerCaseLetter + number +'">' + letter + '-' + number + '</div>');

				if (currentCardStack.indexOf(lowerCaseLetter + number) === -1) {
					verseToggle.addClass('disabled');
				}

				verseToggle.click(function() {
					var cardIndex = $(this).attr('data-value');
					if ($(this).hasClass('disabled')) {
						// enable
						$(this).removeClass('disabled');
						insertCard(cardIndex);
					}
					else {
						// disable
						$(this).addClass('disabled');
						removeCard(cardIndex);
					}
				});

				verseGroup.append(verseToggle);
			}
			$('.verseToggles').append(verseGroup);
		}

		function insertCard(cardNumber) {
			currentCardStack.push(cardNumber);
			currentCardStack.sort(compareCards);
			var index = currentCardStack.indexOf(cardNumber);
			localStorage.setItem('currentCardStack', JSON.stringify(currentCardStack));
			getCard(cardNumber, currentTranslation).then(function (card) {
			 	card.insertAfter($('#' + currentCardStack[index-1]));
				setActiveCard(currentCardIndex);
			});
		}

		function removeCard(cardNumber) {
			var index = currentCardStack.indexOf(cardNumber);
			currentCardStack.splice(index, 1);
			localStorage.setItem('currentCardStack', JSON.stringify(currentCardStack));
			$('#' + cardNumber).remove();
			if (index === currentCardIndex) {
				next();
			}
			else {
				setActiveCard(currentCardIndex);
			}
		}



	});
});
