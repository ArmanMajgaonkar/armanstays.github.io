(function( $ ) {
	'use strict';

	/**
	 * All of the code for your public-facing JavaScript source
	 * should reside in this file.
	 *
	 * Note: It has been assumed you will write jQuery code here, so the
	 * $ function reference has been prepared for usage within the scope
	 * of this function.
	 *
	 * This enables you to define handlers, for when the DOM is ready:
	 *
	 * $(function() {
	 *
	 * });
	 *
	 * When the window is loaded:
	 *
	 * $( window ).load(function() {
	 *
	 * });
	 *
	 * ...and/or other possibilities.
	 *
	 * Ideally, it is not considered best practise to attach more than a
	 * single DOM-ready or window-load handler for a particular page.
	 * Although scripts in the WordPress core, Plugins and Themes may be
	 * practising this, we should strive to set a better example in our own work.
	 */
	$(function() {
		function formatState (state) {
			if (!state.id) {
			  return state.text;
			}
			var baseUrl = "user/pages/images/flags.html";
			var $state = $(
			  '<span><img src="' + baseUrl + '/' + state.element.value.toLowerCase() + '.png" class="img-flag" /> ' + state.text + '</span>'
			);
			return $state;
		};

		$('select#keyword').select2({
			ajax: {
    			url: ajaxurl, // AJAX URL is predefined in WordPress admin
    			dataType: 'json',
    			delay: 250, // delay in ms while typing when to perform a AJAX search
				allowClear: true,
    			data: function (params) {
					// console.log(params);
      				return {
        				action: 'ukiyostays_filter_ajax', // AJAX action for admin-ajax.php
						q: params.term, // search query
        				// page: params.page || 1
      				};
    			},
    			processResults: function( data ) {
					// console.log(data);

					var options = [];
					if ( data ) {
				
						// data is the array of arrays, and each of them contains ID and the Label of the option
						$.each( data, function( index, item ) { // do not forget that "index" is just auto incremented value
							options.push( { id: item['post_id'], text: item['post_title'] } );
						});
					
					}
					return {
						results: options
					};
				},
				cache: false
			},
			minimumInputLength: 3, // the minimum of symbols to input before perform a search
			/* escapeMarkup: function(markup) {
				return markup;
			},
			templateResult: function(data) {
				return data.html;
			},
			templateSelection: function(data) {
				return data.text;
			} */
		}).on('select2:open', () => {
			document.querySelector('.select2-search__field').focus();
		}).on('select2:select', function (e) {
			var data = e.params.data;
    		console.log(data);
		});

		$('input#guests_3').keyup(function(e){
			$('input#guests_0').val($(this).val());
		});
		
		// https://jqueryui.com/autocomplete/#custom-data
		
		var proto = $.ui.autocomplete.prototype,
		initSource = proto._initSource;

		function filter( array, term ) {
			var matcher = new RegExp( $.ui.autocomplete.escapeRegex(term), "i" );
			return $.grep( array, function(value) {
				return matcher.test( $( "<div>" ).html( value.label || value.value || value ).text() );
			});
		}

		$.extend( proto, {
			_initSource: function() {
				if ( this.options.html && $.isArray(this.options.source) ) {
					this.source = function( request, response ) {
						response( filter( this.options.source, request.term ) );
					};
				} else {
					initSource.call( this );
				}
			},
		
			_renderItem: function( ul, item) {
				if(item.link=='#'){
					return $( "<li></li>" )
						.data( "item.autocomplete", item )
						.append( $( "<a></a>" )[ this.options.html ? "html" : "text" ]( 'Search for "'+item.label+'"' ) )
						.appendTo( ul );
				}else{
					return $( "<li></li>" )
						.data( "item.autocomplete", item )
						.append( $( "<a target='_blank' href='"+item.link+"'></a>" )[ this.options.html ? "html" : "text" ]( item.label ) )
						.appendTo( ul );
				}
			}
		});

		$( "input#ukiyo_keyword" ).autocomplete({
			delay: 500,
			minLength: 3,
			source: function( request, response ) {
				$.ajax({
					type: 'POST',
					url: ukiyos_obj.ajax_url,
					data: {
						q: request.term,
						action: "ukiyostays_filter_ajax"
					},
					success: function(data) {
						var data_obj = JSON.parse(data);
						response( $.map(data_obj.result, function(item) {
							return {
								label: item.label.replace('__**__', data_obj.term),
								value: item.value,
								link: item.link
							};
						}));
					}
				});
			},
			select: function( event, ui ) {
				// console.log(ui);
				
				if(ui.item.link == '#'){
					$( "input#ukiyo_keyword" ).val( ui.item.label );
					$('input#ukiyo_keyword').removeAttr('style');
					$.ajax({
						type: 'POST',
						url: ukiyos_obj.ajax_url,
						data: {
							q: ui.item.label,
							action: "ukiyostays_select_option_ajax"
						},
						success: function(data) {
							// alert(data);
							var data_obj = JSON.parse(data);
							if(data_obj.location_id > 0){
								$( "input#add_ids_ba_locations" ).val( data_obj.location_id );
								$('<input>').attr({
									type: 'hidden',
									id: 'terms',
									name: 'terms['+data_obj.location_id+']',
									value: data_obj.location_id
								}).appendTo('form#ukiyo_form');
							}else{
								$( "input#ukiyo_keyword" ).val( '' );			
							}
						}
					});
				}
				
				return false;
			}
		})
		.focus(function () {
			//reset result list's pageindex when focus on
			window.pageIndex = 0;
			$(this).autocomplete("search");
		});
	});

	$('form#ukiyo_form button').click(function(e){
		if($('input#add_ids_ba_locations').val()==0){
			$('input#ukiyo_keyword').val('').css({'border': '1px solid red'});
			e.preventDefault();
		}else{
			$('input#ukiyo_keyword').removeAttr('style');
			$('form#ukiyo_form').submit();
		}
	});
	
})( jQuery );
