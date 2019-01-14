// Initialize app
var myApp = new Framework7({
    pushState: true
});


// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;

var db = null;

// Add view
var mainView = myApp.addView('.view-main', {
    // Because we want to use dynamic navbar, we need to enable it for this view:
    dynamicNavbar: true
});

function conpert(moneys) {
    return moneys.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1.");
}

function initializeTable() {
    db.transaction(function (tx) {
        tx.executeSql("select tanggal,total,(select count(*) from daftar w where q.id >= w.id) as cnt " +
            "from daftar q where cnt <= 7"
            , [], function (tx, rs) {
                if (rs && rs.rows.length) {
                    var dataaa = "";
                    for (var a = 0; a < rs.rows.length; a++) {
                        dataaa += "<tr>";
                        dataaa += "<td class=\"label-cell\" style=\"text-align:center\">" + rs.rows.item(a).tanggal + "</td>";
                        dataaa += "<td class=\"numeric-cell\" style=\"text-align:right\">RP " + conpert(rs.rows.item(a).total) + "</td>";
                        dataaa += "</tr>";
                    }
                    $$("#pol").html(dataaa);
                }
            }, function (tx, error) {
                myApp.alert("Error cuk : " + error.message);
            }, function () {
                myApp.alert("Berhasul");
            });
    })
}


// Handle Cordova Device Ready Event
$$(document).on('deviceready', function () {

    db = window.sqlitePlugin.openDatabase({
        name: 'my.db',
        location: 'default',
    });

    db.transaction(function (tx) {
        tx.executeSql('CREATE TABLE IF NOT EXISTS barang (id Integer primary key autoincrement, deskripsi text, harga Integer, tanggal text,bulan text)');
        tx.executeSql('CREATE TABLE IF NOT EXISTS daftar (id Integer primary key autoincrement, total Integer, tanggal text)');
    }, function (error) {
        myApp.alert("Create gagal +" + error.message);
    }, function () {
        myApp.alert("Create oke");
    });

    initializeTable();
});



myApp.onPageInit('index', function (page) {
    initializeTable();
})

myApp.onPageInit('login-screen', function (page) {
    var pageContainer = $$(page.container);
    pageContainer.find('.belis').on('click', function () {
        var username = pageContainer.find('input[name="username"]').val();
        var password = pageContainer.find('input[name="password"]').val();
        // Handle username and password
        if (username == "Arif" && password == "arif") {
            mainView.router.load({ url: "admin.html" });
        } else {
            myApp.alert("User / password salah");
        }
    });
})

myApp.onPageInit('admin', function (page) {
    $$('.confirm-ok').on('click', function () {
        myApp.confirm('Are you sure?', function () {
            db.transaction(function (tx) {
                tx.executeSql("drop table if EXISTS barang");
                tx.executeSql("drop table if EXISTS daftar");
            }, function (tx, error) {
                myApp.alert("Drop gagal : " + error.message);
            }, function () {
                myApp.alert("Drop berhasil, Aplikasi harus direstart", function () {
                    navigator.app.exitApp();
                });
            });
        });
    });
})

function clearForm(obejek) {
    if (obejek != null && obejek.length > 0) {
        for (var a = 0; a < obejek.length; a++) {
            document.getElementById(obejek[a]).value = "";
        }
    } else {
        myApp.alert("Kosong");
    }
}

// Option 1. Using page callback for page (for "about" page in this case) (recommended way):
myApp.onPageInit('about', function (page) {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1;

    var yyyy = today.getFullYear();
    if (dd < 10) {
        dd = '0' + dd;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }
    var today = dd + '/' + mm + '/' + yyyy;
    document.getElementById("tanggal").value = today;

    $$("#save").click(function () {
        var deskripsi = document.getElementById("deskripsi").value;
        var harga = document.getElementById("harga").value;
        var tanggal = document.getElementById("tanggal").value;
        if (deskripsi != "" && harga != "" && tanggal != "") {
            db.transaction(function (tx) {
                tx.executeSql("insert into barang (deskripsi,harga,tanggal,bulan) "
                    + " values('" + deskripsi + "'," + harga + ",'" + tanggal + "','" + mm + "')");
            }, function (tx, error) {
                myApp.alert('Insert error: ' + error.message);
            }, function () {
                myApp.alert("Data berhasil Ditambahkan");
                forma = ["deskripsi", "harga"];
                clearForm(forma);
            });

            db.transaction(function (tx) {
                tx.executeSql("select * from daftar where tanggal ='" + today + "'", [], function (tx, rs) {
                    if (rs && rs.rows.length > 0) {
                        db.transaction(function (tx) {
                            tx.executeSql("update daftar set total = total + " + harga);
                        }, function (error) {
                            myApp.alert("Update Daftar gagal");
                        }, function () {
                            page.view.router.back({
                                url: "index.html",
                                force: true,
                                ignoreCache: true
                            })
                        })
                    }
                    else {
                        db.transaction(function (tx) {
                            tx.executeSql("insert into daftar (tanggal,total) values('" + today + "'," + harga + ")")
                        }, function (error) {
                            myApp.alert("Insert daftar gagal " + error.message);
                        }, function () {
                            page.view.router.back({
                                url: "index.html",
                                force: true,
                                ignoreCache: true
                            })
                        });
                    }
                })
            })
        } else {
            nonot("Semua Data harus diisi");
        }
    });

    $$("#cancel").click(function () {
        forma = ["deskripsi", "harga"];
        clearForm(forma);
    })
})

myApp.onPageInit('detail', function (page) {
    var w = document.getElementById("wombocombo");
    w.onchange = (event) => {
        var inputText = event.target.value;
        db.transaction(function (tx) {
            tx.executeSql("select distinct tanggal from barang where bulan = '" + inputText + "'", [], function (tx, rs) {
                var det = "";
                if (rs && rs.rows.length > 0) {
                    for (var a = 0; a < rs.rows.length; a++) {
                        det += "<option id=\"gokil\" value=" + rs.rows.item(a).tanggal + ">" + rs.rows.item(a).tanggal + "</option>";
                    }
                    $$("#tanggalan").html(det);
                    if (document.readyState == "complete") {
                        var e = document.getElementById("tanggalan");
                        var t = document.getElementById("gokil");
                        if ($$("#tanggalan")) {
                            myApp.alert("Tidak kosong");
                        } else {
                            myApp.alert("Kosong");
                        }
                        t.innerHTML = "Mabok lo tong";
                        myApp.alert("YUHUUU : " + t);
                        myApp.alert("dataku : " + e.option[e.selectedIndex].value);
                        myApp.alert("Sudah selesai load : " + e);
                        e.onchange = (event) => {
                            myApp.alert("Sudah masuk ke dalam sisni");
                            var inputTexto = event.target.value;
                            myApp.alert("Inputku : " + inputTexto);
                        }
                    }
                } else {
                    $$("#tanggalan").html(det);
                }
            }, function (tx, error) {
                myApp.alert("Error : " + error.message);
            }, function () {
                myApp.alert("Succes Load");
            });
        });
    }
})

function nonot(title) {
    myApp.addNotification({
        title: 'Error',
        subtitle: 'Info',
        message: title,
        media: '<i class="f7-icons color-red">info</i>'
    });
}