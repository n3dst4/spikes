/*
 * iGoogle-esque layout demo
 */


/*
 * Pretends to do an AJAX call and comes back with column specs
 * XXX replace with AJAX call
 */
function get_column_specs()
    {
    return my_column_specs
    }

/*
 * Pretends to do an AJAX call and comes back with list of nodes
 * XXX replace with AJAX call
 */
function get_node_data()
    {
    data = new Array()
    $.each(my_node_data, function(k, v)
        {
        data.push(v)
        })
    return data
    }

/*
 * Create columns based on current column spec, load nodes
 * and insert them into columns.
 */
function load_columns()
    {
    // Imagine column_spec and node_data are coming in via JSON
    column_spec = get_column_specs()
    node_data = get_node_data()
    node_data.sort(function(a,b)
        {
        if (a['order'] == b['order'])
            return a['column_affinity'] - b['column_affinity']
        else
            return a['order'] - b['order']
        })
    // Set up the div that contains all the columns
    var holder = $("div.column_holder")
    holder.children().remove()
    for (col_id = 0; col_id < column_spec.length; col_id++)
        {
        var column = $("<div class='column_outer' id='outer_" + col_id + "'><div class='column_inner'></div></div>")
        column.css("width", column_spec[col_id]+ "%")
        holder.append(column)
        }
    // clearing div makes holding div expand to encompass the columns
    holder.append($("<div class='column_clear'></div>"))
    // insert nodes into repective columns
    $.each(node_data, function(i, node_spec)
        {
        //console.log(node_spec['title'])
        title = $("<h2>" + node_spec['title'] + "</h2>")
        body = $("<p>" + node_spec['content'] + "</p>")
        node = $("<div class='node'></div>")
        node.append(title)
        node.append(body)
        node.attr('id', 'node_'+node_spec['uid'])
        if ($("div#outer_" + node_spec['column_affinity']).length > 0)
            $("div#outer_" + node_spec['column_affinity'] + " div.column_inner").append(node)
        else
            $("div#outer_0 div.column_inner").prepend(node)
        })
    equalise_columns()
    $("div.column_inner").Sortable(
        {
        'accept': 'node',
        'helperclass': 'helper',
        'tolerance': 'pointer',
        'opacity': 0.4,
        'handle': 'h2',
        'onStop': function()
            {
            save_position(this)
            equalise_columns()
            }
        })
    }

/*
 * Takes a DOM object of a node and saves it's position
 * This dummy version just munges an array
 * XXX: replace with AJAX
 */
function save_position(node)
    {
    node_number = $(node).attr("id").match(/node_(\d+)/)[1]
    column_number = $(node).parent().parent().attr("id").match(/outer_(\d+)/)[1]
    my_node_data[node_number]['column_affinity'] = column_number
    $(node).parent().children().each(function(i)
        {
        node_number = $(this).attr("id").match(/node_(\d+)/)[1]
        my_node_data[node_number]['order'] = i
        })
    }

/*
 * Sets the height of <body> to be at least as tall as the window.
 * This is necessary so the background fade used by
 * the modal dialogue covers the whole window.
 */
function set_body_height()
    {
    //if ($("html").length > 0) alert("html exists")
    if ($("body").height() < $(window).height())
        $("body").height($(window).height())
    }

/*
 * Makes all the columns the same height.
 * This allows you drag a node into the empty space at the bottom of a column.
 */
function equalise_columns()
    {
    console.info("Column equalisation")
    var max_height = 0
    $("div.column_outer").height("auto")
    $("div.column_outer").each(function()
        {
        max_height = Math.max(max_height, $(this).height())
        //console.log($(this).attr('id') + " is " + $(this).height() + " pixels tall")
        })
    $("div.column_outer").each(function()
        {
        if ($(this).height() < max_height)
            $(this).height(max_height)
        })
    }

/*
 * JQuery startup code
 */
$(function()
    {
    // create columns and fill them
    load_columns()
    // create trigger for modal dialog
    $("a#change_layout").click(function()
        {
        var previous = column_spec_name
        set_body_height()
        $.prompt(chooser_txt, {
            container: "body",
            opacity: 0.5,
            buttons: {Save: true, Cancel: false},
            submit: function(value, message)
                {
                if (! value)
                    {
                    $("#layout-" + previous).click()
                    }
                return true;
                }
            })
        $("img.close_button").click(function()
            {
            $("#jqibuttonSave").click()
            })
        $("table.layout_chooser input").click(function()
            {
            my_column_specs = $(this).val().split('-')
            load_columns()
            column_spec_name = $(this).siblings("img").attr("alt")
            $("table.layout_chooser img").each(function()
                {
                $(this).attr("src", "images/unselected/" + $(this).attr("alt") + ".png" )
                })
            $(this).siblings("img").attr("src", "images/selected/" + $(this).siblings("img").attr("alt") + ".png" )
            })
        $("table.layout_chooser img").click(function()
            {
            $(this).siblings("input").click()
            })
        $("table.layout_chooser img").each(function(i)
            {
            if ($(this).attr("alt") == column_spec_name)
                {
                $(this).attr("src", "images/selected/" + column_spec_name + ".png")
                console.log($(this).siblings("input").size())
                $(this).siblings("input").attr("checked", true)
                }
            })
        })

    })

////////////////////////////////////////////////////////////////////////////////
// Mock data
// These data would be held server side and access by cleverness and AJAX
var my_column_specs = [32, 32, 32]
var column_spec_name = "33-33-33"
// assoc. array with sequential integer indexes? Yes, because they could be anything.
var my_node_data = {
            0: {'uid': 0, 'title': "Lorem",   'content': "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Donec ultricies feugiat mi. Donec nec ligula ut nisi dapibus dignissim. Duis placerat sollicitudin ante. Ut porttitor ligula eu nibh. Sed tincidunt nibh eget turpis. Fusce vel urna id tellus placerat dapibus. Praesent ornare rutrum ante",  'column_affinity': 0, order: 0},
            1: {'uid': 1, 'title': "Vestibulum",   'content': "Vestibulum sodales imperdiet dolor. Praesent egestas egestas neque. Donec ac ante. Maecenas et felis. Etiam tempus ultrices felis. Aliquam lacus dolor, aliquet nec, malesuada eu, semper id, lorem. Curabitur vitae neque nec lacus ornare faucibus",  'column_affinity': 0, order: 1},
            2: {'uid': 2, 'title': "Sed Felis", 'content': "Sed felis risus, tempus ut, ultricies adipiscing, rutrum vel, eros. Donec nisi nulla, tristique nonummy, tempor in, ultricies non, magna. Morbi sodales, quam sit amet fermentum pellentesque, eros lorem porttitor lectus, id lobortis nunc leo in nisi. In hac habitasse platea dictumst",  'column_affinity': 1, order: 0},
            3: {'uid': 3, 'title': "Nullam Vitae Lectus non Nisi Aliquet Auctor",   'content': "Nullam vitae lectus non nisi aliquet auctor. Cras venenatis venenatis magna. Mauris felis. Donec pharetra pede. Vivamus pellentesque. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum sit amet dui et odio viverra ullamcorper. Quisque elit. Aenean vel tortor. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos hymenaeos. Fusce laoreet viverra augue. In ac sapien. Vivamus ut nisi id eros pretium sodales. Pellentesque adipiscing dictum quam. Vivamus dignissim condimentum risus. Quisque in orci sed sapien dictum viverra. In accumsan nunc id ante. Sed dapibus pretium sapien.",  'column_affinity': 1, order: 1},
            4: {'uid': 4, 'title': "Sed id Erat",    'content': "Sed id erat. Donec ante mi, scelerisque in, egestas at, dictum eu, urna.",  'column_affinity': 2, order: 2},
            5: {'uid': 5, 'title': "Nunc Mattis", 'content': "Nunc mattis ornare ante. Morbi leo lectus, nonummy a, pretium vitae, pretium quis, turpis. Proin molestie ante eget nisi. Proin at nibh quis enim commodo dictum. Morbi dapibus augue ut elit.",  'column_affinity': 2, order: 0},
            6: {'uid': 6, 'title': "Nunc Quis",    'content': "Nunc quis libero sit amet leo posuere volutpat. Nulla elit. Cras imperdiet cursus sapien. Nunc luctus elit eget augue. Pellentesque vulputate. Vivamus a justo. Maecenas vestibulum mollis leo. Integer eget leo elementum tellus tincidunt rhoncus. Donec euismod lacinia augue.",  'column_affinity': 2, order: 1},
            7: {'uid': 7, 'title': "Phasellus",   'content': "Phasellus non turpis. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Proin venenatis nibh quis sem. Aliquam magna.",  'column_affinity': 2, order: 2},
            8: {'uid': 8, 'title': "Proin et Ligula",   'content': "Proin eu ligula. Sed porta convallis magna. Nam eleifend. Aliquam nisl felis, scelerisque at, porta non, eleifend pretium, diam. Quisque hendrerit risus non eros. Ut tempor ultrices odio. Aliquam erat volutpat. Vestibulum ac nunc a tellus bibendum dignissim. Quisque felis. In quis velit.",  'column_affinity': 3, order: 0}
            }

////////////////////////////////////////////////////////////////////////////////
// Semi-static data
// How I wish JS had multi-line strings.
chooser_txt = '\
<img src="images/close.png" alt="close" title="close" class="close_button"/>\
<p>Select layout:</p>\
<table summary="Layout options" class="layout_chooser">\
    <thead>\
        <tr>\
            <th scope="col">1-Column</th>\
            <th scope="col">2-Column</th>\
            <th scope="col">3-Column</th>\
            <th scope="col">4-Column</th>\
        </tr>\
    </thead>\
    <tbody>\
        <tr>\
            <td><input type="radio" name="layoutchoice" value="100" id="layout-100"/>\
                <img src="images/unselected/100.png" alt="100"/></td>\
            <td><input type="radio" name="layoutchoice" value="48-48" id="layout-50-50"/>\
                <img src="images/unselected/50-50.png" alt="50-50"/></td>\
            <td><input type="radio" name="layoutchoice" value="32-32-32" id="layout-33-33-33"/>\
                <img src="images/unselected/33-33-33.png" alt="33-33-33"/></td>\
            <td><input type="radio" name="layoutchoice" value="24-24-24-24" id="layout-25-25-25-25"/>\
                <img src="images/unselected/25-25-25-25.png" alt="25-25-25-25"/></td>\
        </tr>\
        <tr>\
            <td></td>\
            <td><input type="radio" name="layoutchoice" value="32-64" id="layout-33-66"/>\
                <img src="images/unselected/33-66.png" alt="33-66"/></td>\
            <td><input type="radio" name="layoutchoice" value="24-48-24" id="layout-25-50-25"/>\
                <img src="images/unselected/25-50-25.png" alt="25-50-25"/></td>\
            <td></td>\
        </tr>\
        <tr>\
            <td></td>\
            <td><input type="radio" name="layoutchoice" value="64-32" id="layout-66-33"/>\
                <img src="images/unselected/66-33.png" alt="66-33"/></td>\
            <td></td>\
            <td></td>\
        </tr>\
    </tbody>\
</table>\
'























