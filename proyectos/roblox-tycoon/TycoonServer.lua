--[[
	TYCOON FÁCIL - Script único
	============================================================
	Dónde va: Roblox Studio > Explorer > ServerScriptService
	          > clic derecho > Insert Object > Script
	          Pega TODO este archivo dentro y dale a Play.

	Qué hace este script por sí solo:
	  * Construye 4 parcelas (una por jugador) alrededor del spawn.
	  * Cada jugador toca el cuadro verde para reclamar su parcela.
	  * Los goteros sueltan bloques que viajan por la cinta hasta
	    el recolector y te dan dinero.
	  * Pisa los botones para comprar mejoras con tu dinero.
	  * Guarda dinero y compras (si activas los API Services).

	Para cambiar precios, velocidades o valores, edita la tabla
	MEJORAS más abajo. ¡No necesitas tocar nada más!
]]

local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local RunService = game:GetService("RunService")

------------------------------------------------------------------
-- AJUSTES GENERALES
------------------------------------------------------------------
local AJUSTES = {
	NOMBRE_MONEDA = "Dinero",
	DINERO_INICIAL = 0,
	VELOCIDAD_CINTA = 8,        -- studs por segundo
	VIDA_BLOQUE = 25,           -- segundos antes de borrar un bloque perdido
	AUTOGUARDADO = 60,          -- segundos entre guardados
	CLAVE_DATOS = "TycoonFacil_v1",
}

------------------------------------------------------------------
-- MEJORAS (el corazón del juego: edítalas a tu gusto)
--   id        : nombre interno único
--   nombre    : lo que ve el jugador en el botón
--   precio    : cuánto cuesta
--   requiere  : id de la mejora que hay que comprar antes (o nil)
--   tipo      : "gotero", "paredes", "mejorador" o "torre"
--   x         : posición del botón en la fila de botones
------------------------------------------------------------------
local MEJORAS = {
	{ id = "Gotero1", nombre = "Gotero básico", precio = 0, requiere = nil,
		tipo = "gotero", hueco = 1, cada = 2, valor = 1, color = Color3.fromRGB(163, 162, 165) },

	{ id = "Gotero2", nombre = "Gotero de bronce", precio = 25, requiere = nil, x = -20,
		tipo = "gotero", hueco = 2, cada = 2, valor = 3, color = Color3.fromRGB(205, 127, 50) },

	{ id = "Paredes", nombre = "Paredes", precio = 50, requiere = nil, x = -10,
		tipo = "paredes" },

	{ id = "Gotero3", nombre = "Gotero de plata", precio = 150, requiere = "Gotero2", x = 0,
		tipo = "gotero", hueco = 3, cada = 1.5, valor = 8, color = Color3.fromRGB(200, 200, 215) },

	{ id = "Mejorador", nombre = "Mejorador x2", precio = 400, requiere = "Gotero3", x = 10,
		tipo = "mejorador" },

	{ id = "Gotero4", nombre = "Gotero de oro", precio = 1200, requiere = "Mejorador", x = 20,
		tipo = "gotero", hueco = 4, cada = 1, valor = 25, color = Color3.fromRGB(255, 200, 40) },

	{ id = "Torre", nombre = "Torre de la victoria", precio = 5000, requiere = "Gotero4", x = -15,
		z = 18, tipo = "torre" },
}

local MEJORA_POR_ID = {}
for _, m in ipairs(MEJORAS) do
	MEJORA_POR_ID[m.id] = m
end

------------------------------------------------------------------
-- UTILIDADES
------------------------------------------------------------------
local function crearPieza(props)
	local p = Instance.new("Part")
	p.Anchored = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	for k, v in pairs(props) do
		if k ~= "Parent" then
			p[k] = v
		end
	end
	p.Parent = props.Parent
	return p
end

local function crearCartel(pieza, texto, alto)
	local gui = Instance.new("BillboardGui")
	gui.Size = UDim2.new(0, 220, 0, 60)
	gui.StudsOffset = Vector3.new(0, alto or 3, 0)
	gui.AlwaysOnTop = false
	gui.MaxDistance = 80
	gui.Adornee = pieza

	local etiqueta = Instance.new("TextLabel")
	etiqueta.Name = "Texto"
	etiqueta.Size = UDim2.new(1, 0, 1, 0)
	etiqueta.BackgroundTransparency = 1
	etiqueta.TextScaled = true
	etiqueta.Font = Enum.Font.FredokaOne
	etiqueta.TextColor3 = Color3.new(1, 1, 1)
	etiqueta.TextStrokeTransparency = 0
	etiqueta.Text = texto
	etiqueta.Parent = gui

	gui.Parent = pieza
	return etiqueta
end

local function jugadorDesdeToque(golpe)
	local personaje = golpe and golpe.Parent
	if not personaje then
		return nil
	end
	local jugador = Players:GetPlayerFromCharacter(personaje)
	if not jugador then
		return nil
	end
	local humanoide = personaje:FindFirstChildOfClass("Humanoid")
	if not humanoide or humanoide.Health <= 0 then
		return nil
	end
	return jugador
end

local function formatoDinero(n)
	return "$" .. tostring(n)
end

------------------------------------------------------------------
-- DATOS DEL JUGADOR (dinero + compras) Y GUARDADO
------------------------------------------------------------------
local almacen = nil
local okAlmacen = pcall(function()
	almacen = DataStoreService:GetDataStore(AJUSTES.CLAVE_DATOS)
end)
if not okAlmacen then
	warn("[Tycoon] No se pudo abrir el DataStore. El progreso NO se guardará.")
end

local datos = {} -- datos[jugador] = { Compras = {id=true} }

local function obtenerDinero(jugador)
	local stats = jugador:FindFirstChild("leaderstats")
	return stats and stats:FindFirstChild(AJUSTES.NOMBRE_MONEDA)
end

local function sumarDinero(jugador, cantidad)
	local valor = obtenerDinero(jugador)
	if valor then
		valor.Value = valor.Value + cantidad
	end
end

local function cargarDatos(jugador)
	local guardado = nil
	if almacen then
		local ok, resultado = pcall(function()
			return almacen:GetAsync("jugador_" .. jugador.UserId)
		end)
		if ok then
			guardado = resultado
		else
			warn("[Tycoon] Error al cargar datos: " .. tostring(resultado))
		end
	end
	guardado = guardado or {}
	return {
		Dinero = tonumber(guardado.Dinero) or AJUSTES.DINERO_INICIAL,
		Compras = type(guardado.Compras) == "table" and guardado.Compras or {},
	}
end

local function guardarDatos(jugador)
	local d = datos[jugador]
	local valor = obtenerDinero(jugador)
	if not almacen or not d or not valor then
		return
	end
	local paquete = { Dinero = valor.Value, Compras = d.Compras }
	local ok, err = pcall(function()
		almacen:SetAsync("jugador_" .. jugador.UserId, paquete)
	end)
	if not ok then
		warn("[Tycoon] Error al guardar: " .. tostring(err))
	end
end

------------------------------------------------------------------
-- PARCELAS
------------------------------------------------------------------
local carpetaTycoons = Instance.new("Folder")
carpetaTycoons.Name = "Tycoons"
carpetaTycoons.Parent = workspace

-- Posición y orientación de cada parcela (todas miran hacia el spawn)
local POSICIONES = {
	CFrame.new(-45, 0, -75),
	CFrame.new(45, 0, -75),
	CFrame.new(-45, 0, 75) * CFrame.Angles(0, math.pi, 0),
	CFrame.new(45, 0, 75) * CFrame.Angles(0, math.pi, 0),
}

local COLORES_PARCELA = {
	Color3.fromRGB(85, 170, 255),
	Color3.fromRGB(255, 120, 120),
	Color3.fromRGB(140, 220, 120),
	Color3.fromRGB(200, 140, 255),
}

local parcelas = {} -- lista de tablas de estado

-- Coordenadas locales de la línea de producción
local Z_CINTA = -10
local X_GOTEROS = { -18, -10, -2, 6 }
local X_MEJORADOR = 11
local X_RECOLECTOR = 16

local function aMundo(parcela, x, y, z)
	return parcela.cf * CFrame.new(x, y, z)
end

local refrescarBotones -- se define más abajo

------------------------------------------------------------------
-- CONSTRUCCIÓN DE CADA MEJORA
------------------------------------------------------------------
local function soltarBloque(parcela, mejora, posicion)
	local bloque = crearPieza({
		Name = "Bloque",
		Size = Vector3.new(1.2, 1.2, 1.2),
		CFrame = CFrame.new(posicion),
		Anchored = false,
		Color = mejora.color,
		Material = Enum.Material.SmoothPlastic,
		Parent = parcela.carpetaBloques,
	})
	bloque:SetAttribute("Valor", mejora.valor)
	pcall(function()
		bloque:SetNetworkOwner(nil) -- el servidor controla la física
	end)
	task.delay(AJUSTES.VIDA_BLOQUE, function()
		if bloque.Parent then
			bloque:Destroy()
		end
	end)
end

local CONSTRUCTORES = {}

CONSTRUCTORES.gotero = function(parcela, mejora)
	local x = X_GOTEROS[mejora.hueco]
	local modelo = Instance.new("Model")
	modelo.Name = mejora.id
	modelo.Parent = parcela.carpetaConstruido

	-- Patas
	for _, dz in ipairs({ -4, 4 }) do
		crearPieza({
			Name = "Pata",
			Size = Vector3.new(1, 9, 1),
			CFrame = aMundo(parcela, x, 5.5, Z_CINTA + dz),
			Color = Color3.fromRGB(60, 60, 60),
			Parent = modelo,
		})
	end
	-- Cuerpo
	local cuerpo = crearPieza({
		Name = "Cuerpo",
		Size = Vector3.new(4, 3, 9),
		CFrame = aMundo(parcela, x, 10.5, Z_CINTA),
		Color = mejora.color,
		Material = Enum.Material.Metal,
		Parent = modelo,
	})
	crearPieza({
		Name = "Boquilla",
		Size = Vector3.new(2, 1, 2),
		CFrame = aMundo(parcela, x, 8.5, Z_CINTA),
		Color = Color3.fromRGB(30, 30, 30),
		Parent = modelo,
	})
	crearCartel(cuerpo, mejora.nombre .. "\n+" .. formatoDinero(mejora.valor), 3)

	local salida = aMundo(parcela, x, 7, Z_CINTA).Position
	task.spawn(function()
		while modelo.Parent do
			task.wait(mejora.cada)
			if modelo.Parent then
				soltarBloque(parcela, mejora, salida)
			end
		end
	end)
end

CONSTRUCTORES.paredes = function(parcela, mejora)
	local modelo = Instance.new("Model")
	modelo.Name = mejora.id
	modelo.Parent = parcela.carpetaConstruido
	local color = parcela.color
	local muros = {
		{ Vector3.new(60, 10, 1), 0, -29.5 }, -- fondo
		{ Vector3.new(1, 10, 60), -29.5, 0 }, -- izquierda
		{ Vector3.new(1, 10, 60), 29.5, 0 },  -- derecha
		{ Vector3.new(20, 10, 1), -20, 29.5 }, -- frente izq.
		{ Vector3.new(20, 10, 1), 20, 29.5 },  -- frente der. (hueco en el centro = puerta)
	}
	for _, m in ipairs(muros) do
		crearPieza({
			Name = "Pared",
			Size = m[1],
			CFrame = aMundo(parcela, m[2], 6, m[3]),
			Color = color,
			Material = Enum.Material.Brick,
			Parent = modelo,
		})
	end
end

CONSTRUCTORES.mejorador = function(parcela, mejora)
	local modelo = Instance.new("Model")
	modelo.Name = mejora.id
	modelo.Parent = parcela.carpetaConstruido

	for _, dz in ipairs({ -4, 4 }) do
		crearPieza({
			Name = "Poste",
			Size = Vector3.new(1, 7, 1),
			CFrame = aMundo(parcela, X_MEJORADOR, 6, Z_CINTA + dz),
			Color = Color3.fromRGB(40, 40, 60),
			Parent = modelo,
		})
	end
	local campo = crearPieza({
		Name = "Campo",
		Size = Vector3.new(1, 5, 6),
		CFrame = aMundo(parcela, X_MEJORADOR, 5.5, Z_CINTA),
		Color = Color3.fromRGB(0, 200, 255),
		Material = Enum.Material.Neon,
		Transparency = 0.5,
		CanCollide = false,
		Parent = modelo,
	})
	crearCartel(campo, "Mejorador x2", 4)

	campo.Touched:Connect(function(golpe)
		if golpe.Name == "Bloque" and golpe:GetAttribute("Valor") and not golpe:GetAttribute("Mejorado") then
			golpe:SetAttribute("Mejorado", true)
			golpe:SetAttribute("Valor", golpe:GetAttribute("Valor") * 2)
			golpe.Material = Enum.Material.Neon
		end
	end)
end

CONSTRUCTORES.torre = function(parcela, mejora)
	local modelo = Instance.new("Model")
	modelo.Name = mejora.id
	modelo.Parent = parcela.carpetaConstruido
	local oro = Color3.fromRGB(255, 200, 40)
	for i = 0, 4 do
		local ancho = 8 - i
		crearPieza({
			Name = "Piso" .. i,
			Size = Vector3.new(ancho, 4, ancho),
			CFrame = aMundo(parcela, 20, 3 + i * 4, 18),
			Color = (i % 2 == 0) and oro or Color3.new(1, 1, 1),
			Material = Enum.Material.Marble,
			Parent = modelo,
		})
	end
	local bola = crearPieza({
		Name = "Estrella",
		Shape = Enum.PartType.Ball,
		Size = Vector3.new(4, 4, 4),
		CFrame = aMundo(parcela, 20, 24, 18),
		Color = oro,
		Material = Enum.Material.Neon,
		Parent = modelo,
	})
	crearCartel(bola, "¡" .. (parcela.dueno and parcela.dueno.Name or "") .. " ganó!", 4)
end

------------------------------------------------------------------
-- BOTONES DE COMPRA
------------------------------------------------------------------
local function crearBoton(parcela, mejora)
	local boton = crearPieza({
		Name = "Boton_" .. mejora.id,
		Size = Vector3.new(5, 0.6, 5),
		CFrame = aMundo(parcela, mejora.x or 0, 1.3, mejora.z or 10),
		Color = Color3.fromRGB(0, 200, 90),
		Material = Enum.Material.Neon,
		Parent = parcela.carpetaBotones,
	})
	crearCartel(boton, mejora.nombre .. "\n" .. formatoDinero(mejora.precio), 3)

	local ocupado = false
	boton.Touched:Connect(function(golpe)
		if ocupado then
			return
		end
		local jugador = jugadorDesdeToque(golpe)
		if not jugador or jugador ~= parcela.dueno then
			return
		end
		local d = datos[jugador]
		local dinero = obtenerDinero(jugador)
		if not d or not dinero or d.Compras[mejora.id] then
			return
		end

		ocupado = true
		if dinero.Value >= mejora.precio then
			dinero.Value = dinero.Value - mejora.precio
			d.Compras[mejora.id] = true
			boton:Destroy()
			CONSTRUCTORES[mejora.tipo](parcela, mejora)
			refrescarBotones(parcela)
		else
			-- No alcanza: el botón parpadea en rojo
			boton.Color = Color3.fromRGB(220, 40, 40)
			task.wait(0.6)
			if boton.Parent then
				boton.Color = Color3.fromRGB(0, 200, 90)
			end
		end
		ocupado = false
	end)
end

refrescarBotones = function(parcela)
	local d = parcela.dueno and datos[parcela.dueno]
	if not d then
		return
	end
	for _, mejora in ipairs(MEJORAS) do
		local yaComprada = d.Compras[mejora.id]
		local desbloqueada = (mejora.requiere == nil) or d.Compras[mejora.requiere]
		local existe = parcela.carpetaBotones:FindFirstChild("Boton_" .. mejora.id)
		if not yaComprada and desbloqueada and not existe and mejora.precio > 0 then
			crearBoton(parcela, mejora)
		end
	end
end

------------------------------------------------------------------
-- RECLAMAR / LIBERAR PARCELA
------------------------------------------------------------------
local function parcelaDe(jugador)
	for _, p in ipairs(parcelas) do
		if p.dueno == jugador then
			return p
		end
	end
	return nil
end

local function reclamar(parcela, jugador)
	if parcela.dueno or parcelaDe(jugador) or not datos[jugador] then
		return
	end
	parcela.dueno = jugador
	parcela.cartelDueno.Text = "Parcela de " .. jugador.Name
	parcela.zonaReclamo.Transparency = 1
	parcela.zonaReclamo.CanTouch = false
	parcela.textoReclamo.Text = ""

	local d = datos[jugador]
	d.Compras["Gotero1"] = true -- el primer gotero es gratis

	-- Reconstruir todo lo que ya había comprado (progreso guardado)
	for _, mejora in ipairs(MEJORAS) do
		if d.Compras[mejora.id] then
			CONSTRUCTORES[mejora.tipo](parcela, mejora)
		end
	end
	refrescarBotones(parcela)
end

local function liberar(parcela)
	parcela.dueno = nil
	parcela.carpetaConstruido:ClearAllChildren()
	parcela.carpetaBotones:ClearAllChildren()
	parcela.carpetaBloques:ClearAllChildren()
	parcela.cartelDueno.Text = "Parcela libre"
	parcela.zonaReclamo.Transparency = 0
	parcela.zonaReclamo.CanTouch = true
	parcela.textoReclamo.Text = "¡Toca aquí para\nreclamar!"
end

------------------------------------------------------------------
-- CREAR LAS PARCELAS BASE
------------------------------------------------------------------
for i, cf in ipairs(POSICIONES) do
	local modelo = Instance.new("Model")
	modelo.Name = "Parcela" .. i
	modelo.Parent = carpetaTycoons

	local parcela = {
		cf = cf,
		color = COLORES_PARCELA[i],
		dueno = nil,
	}

	local function carpeta(nombre)
		local f = Instance.new("Folder")
		f.Name = nombre
		f.Parent = modelo
		return f
	end
	parcela.carpetaConstruido = carpeta("Construido")
	parcela.carpetaBotones = carpeta("Botones")
	parcela.carpetaBloques = carpeta("Bloques")

	-- Suelo
	crearPieza({
		Name = "Suelo",
		Size = Vector3.new(60, 1, 60),
		CFrame = aMundo(parcela, 0, 0.5, 0),
		Color = Color3.fromRGB(70, 70, 75),
		Material = Enum.Material.Concrete,
		Parent = modelo,
	})
	-- Borde de color
	crearPieza({
		Name = "Borde",
		Size = Vector3.new(62, 0.8, 62),
		CFrame = aMundo(parcela, 0, 0.4, 0),
		Color = parcela.color,
		Parent = modelo,
	})

	-- Letrero con el nombre del dueño
	local poste = crearPieza({
		Name = "Letrero",
		Size = Vector3.new(12, 4, 1),
		CFrame = aMundo(parcela, 0, 10, -29),
		Color = parcela.color,
		Material = Enum.Material.SmoothPlastic,
		Parent = modelo,
	})
	parcela.cartelDueno = crearCartel(poste, "Parcela libre", 4)

	-- Cinta transportadora (mueve los bloques hacia +X local)
	local cinta = crearPieza({
		Name = "Cinta",
		Size = Vector3.new(36, 1, 6),
		CFrame = aMundo(parcela, -4, 2.5, Z_CINTA),
		Color = Color3.fromRGB(25, 25, 25),
		Material = Enum.Material.DiamondPlate,
		Parent = modelo,
	})
	cinta.AssemblyLinearVelocity = cf.RightVector * AJUSTES.VELOCIDAD_CINTA
	-- Barandillas para que los bloques no se caigan
	for _, dz in ipairs({ -3.25, 3.25 }) do
		crearPieza({
			Name = "Barandilla",
			Size = Vector3.new(36, 1.5, 0.5),
			CFrame = aMundo(parcela, -4, 3.75, Z_CINTA + dz),
			Color = Color3.fromRGB(255, 200, 0),
			Parent = modelo,
		})
	end
	crearPieza({
		Name = "SoporteCinta",
		Size = Vector3.new(36, 2, 4),
		CFrame = aMundo(parcela, -4, 1, Z_CINTA),
		Color = Color3.fromRGB(50, 50, 55),
		Parent = modelo,
	})

	-- Recolector: convierte bloques en dinero
	local recolector = crearPieza({
		Name = "Recolector",
		Size = Vector3.new(4, 5, 7),
		CFrame = aMundo(parcela, X_RECOLECTOR, 3.5, Z_CINTA),
		Color = Color3.fromRGB(255, 60, 60),
		Material = Enum.Material.Neon,
		Parent = modelo,
	})
	crearCartel(recolector, "Recolector", 4)
	recolector.Touched:Connect(function(golpe)
		if golpe.Name ~= "Bloque" or not golpe:IsDescendantOf(parcela.carpetaBloques) then
			return
		end
		if golpe:GetAttribute("Cobrado") then
			return
		end
		golpe:SetAttribute("Cobrado", true)
		if parcela.dueno then
			sumarDinero(parcela.dueno, golpe:GetAttribute("Valor") or 0)
		end
		golpe:Destroy()
	end)

	-- Zona para reclamar
	parcela.zonaReclamo = crearPieza({
		Name = "Reclamar",
		Size = Vector3.new(8, 0.6, 8),
		CFrame = aMundo(parcela, 0, 1.3, 24),
		Color = Color3.fromRGB(0, 255, 120),
		Material = Enum.Material.Neon,
		Parent = modelo,
	})
	parcela.textoReclamo = crearCartel(parcela.zonaReclamo, "¡Toca aquí para\nreclamar!", 3)
	parcela.zonaReclamo.Touched:Connect(function(golpe)
		local jugador = jugadorDesdeToque(golpe)
		if jugador then
			reclamar(parcela, jugador)
		end
	end)

	table.insert(parcelas, parcela)
end

------------------------------------------------------------------
-- ENTRADA Y SALIDA DE JUGADORES
------------------------------------------------------------------
local function alEntrar(jugador)
	local d = cargarDatos(jugador)
	if not jugador.Parent then
		return -- se fue mientras cargábamos
	end

	local stats = Instance.new("Folder")
	stats.Name = "leaderstats" -- este nombre exacto hace que salga en la tabla
	local dinero = Instance.new("IntValue")
	dinero.Name = AJUSTES.NOMBRE_MONEDA
	dinero.Value = d.Dinero
	dinero.Parent = stats
	stats.Parent = jugador

	datos[jugador] = { Compras = d.Compras }
end

local function alSalir(jugador)
	guardarDatos(jugador)
	local p = parcelaDe(jugador)
	if p then
		liberar(p)
	end
	datos[jugador] = nil
end

Players.PlayerAdded:Connect(alEntrar)
Players.PlayerRemoving:Connect(alSalir)
for _, jugador in ipairs(Players:GetPlayers()) do
	task.spawn(alEntrar, jugador)
end

-- Autoguardado
task.spawn(function()
	while true do
		task.wait(AJUSTES.AUTOGUARDADO)
		for jugador in pairs(datos) do
			task.spawn(guardarDatos, jugador)
		end
	end
end)

-- Guardar al cerrar el servidor
game:BindToClose(function()
	if RunService:IsStudio() then
		task.wait(1)
	end
	for _, jugador in ipairs(Players:GetPlayers()) do
		guardarDatos(jugador)
	end
end)

print("[Tycoon] ¡Listo! " .. #parcelas .. " parcelas creadas.")
